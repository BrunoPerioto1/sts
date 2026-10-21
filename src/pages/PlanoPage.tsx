import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addMonths, differenceInCalendarDays, subMonths } from "date-fns";
import { CheckCircle, CircleNotch, FileCsv, PaperPlaneTilt, Scan, type Icon } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/ui/page-header";
import { FormSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SectionLabel } from "@/components/ui/section-label";
import { useMe } from "@/hooks/queries/use-me";
import { postCancelSubscription, postSubscribe } from "@/api/routes/billing";
import type { MeResponse, PlanSummary } from "@/api/routes/get-me";
import { actionToast } from "@/lib/action-toast";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

// Quanto a tela espera o Mercado Pago confirmar depois da volta do checkout.
// O cartão costuma confirmar em segundos; Pix e boleto só quando forem pagos.
const CONFIRM_POLL_MS = 5000;
const CONFIRM_POLL_MAX_MS = 3 * 60 * 1000;
const DAY_MS = 86_400_000;
// Leituras por IA do Grátis (backend: FREE_AI_PER_DAY em src/users/plan.ts). No Pro o /me não manda o limite.
const FREE_AI_PER_DAY = 5;
// Do vencimento pra trás, quanto durava o teste (TRIAL_DAYS = 3 no backend, com folga).
const TRIAL_MAX_MS = 4 * DAY_MS;
// Só o formato (algo@algo.algo): quem confere se o e-mail existe é o Mercado Pago.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const spDate = (date: Date) =>
  date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });
const dayMonth = (date: Date) => date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });

/** O que o Pro tem e o Grátis não, e como fica no Grátis. */
const losses = (aiLimit: number): { icon: Icon; name: string; free: string }[] => [
  { icon: Scan, name: "Leitura de print e áudio", free: `${aiLimit} por dia` },
  { icon: CheckCircle, name: "Conferência pelo placar", free: "manual" },
  { icon: FileCsv, name: "Exportação em CSV", free: "—" },
  { icon: PaperPlaneTilt, name: "Planilhar tips do grupo", free: "—" },
];

type Tone = "warn" | "accent" | "neutral";

type PlanView = {
  tag: string;
  tone: Tone;
  title: string;
  sub: string;
  bar: { pct: number; from: string; to: string } | null;
  /** Título da lista do que se perde no Grátis; null = sem lista. */
  lossTitle: string | null;
  action: { kind: "subscribe"; label: string; note: string } | { kind: "cancel" } | null;
};

const TONES: Record<Tone, { tag: string; border: string; bar: string }> = {
  warn: { tag: "bg-warning/15 text-warning", border: "border-warning/30", bar: "bg-warning" },
  accent: { tag: "bg-accent/15 text-accent-text", border: "border-border", bar: "bg-accent-text" },
  neutral: { tag: "bg-foreground/[0.08] text-zinc-300", border: "border-border", bar: "bg-zinc-500" },
};

/**
 * Os três estados da tela (design "Trackton Plano Renovação"): Pro vencendo,
 * vencido (no Grátis) e assinatura ativa. Quem chega aqui já teve Pro (toda
 * conta nasce com o teste), então a tela fala de renovar, não compara planos.
 *
 * O /me não manda o começo do período: no teste é a criação da conta; na
 * mensalidade, um mês antes do vencimento (cada pagamento soma um mês).
 */
function planView(plan: PlanSummary, me: MeResponse, now: number): PlanView {
  const price = `${formatMoney(plan.price)}/mês`;
  const subscribed = plan.subscription === "authorized";

  if (plan.plan === "free") {
    const expired = me.accessUntil ? new Date(me.accessUntil) : null;
    return {
      tag: expired ? `Venceu em ${dayMonth(expired)}` : "Plano Grátis",
      tone: "neutral",
      title: "Você está no Grátis",
      sub: subscribed
        ? "A renovação automática está ligada, mas o último pagamento ainda não foi aprovado. O Pro volta assim que o Mercado Pago confirmar."
        : "Seu histórico está inteiro. Renove e tudo volta a funcionar na hora.",
      bar: null,
      lossTitle: "Pausado no Grátis",
      action: subscribed ? { kind: "cancel" } : { kind: "subscribe", label: `Voltar pro Pro · ${price}`, note: "Pro a partir de hoje, renovando todo mês" },
    };
  }

  // Pro liberado sem data (conta de admin ou liberada à mão): nada a renovar.
  if (!plan.proUntil) {
    return { tag: "Pro sem prazo", tone: "accent", title: "Pro sem prazo", sub: "Sua conta tem o Pro liberado, sem data pra acabar.", bar: null, lossTitle: null, action: null };
  }

  const until = new Date(plan.proUntil);
  const createdAt = me.createdAt ? new Date(me.createdAt) : null;
  const trial = !plan.subscription && !!createdAt && until.getTime() - createdAt.getTime() <= TRIAL_MAX_MS;
  const start = trial && createdAt ? createdAt : subMonths(until, 1);
  const pct = Math.min(100, Math.max(0, ((now - start.getTime()) / (until.getTime() - start.getTime())) * 100));

  if (subscribed) {
    return {
      tag: "Pro ativo",
      tone: "accent",
      title: `Pro até ${spDate(until)}`,
      sub: "A mensalidade renova sozinha pelo Mercado Pago. Você não precisa fazer nada.",
      bar: { pct, from: `Renovado em ${dayMonth(start)}`, to: `Próxima cobrança ${dayMonth(until)}` },
      lossTitle: null,
      action: { kind: "cancel" },
    };
  }

  const days = differenceInCalendarDays(until, now);
  const keep = "para não perder a leitura ilimitada e a conferência automática. Nada do que você registrou é apagado.";
  return {
    tag: days <= 0 ? "Vence hoje" : days === 1 ? "Vence amanhã" : `Vence em ${days} dias`,
    tone: days <= 7 ? "warn" : "accent",
    title: `Pro até ${spDate(until)}`,
    sub: trial
      ? `Seu teste do Pro termina nessa data. Assine ${keep}`
      : plan.subscription === "cancelled"
        ? `Você cancelou a renovação automática. Renove ${keep}`
        : `Renove ${keep}`,
    bar: { pct, from: `${trial ? "Teste desde" : "Desde"} ${dayMonth(start)}`, to: `Vence em ${dayMonth(until)}` },
    lossTitle: "Se não renovar, você perde",
    // Ainda no Pro: o backend marca a primeira cobrança pro dia em que ele acaba (start_date), e o pagamento soma um mês.
    action: {
      kind: "subscribe",
      label: `${trial ? "Continuar no Pro" : "Renovar Pro"} · ${price}`,
      note: `Primeira cobrança em ${dayMonth(until)} · Pro até ${spDate(addMonths(until, 1))}`,
    },
  };
}

function StatusCard({ view }: { view: PlanView }) {
  const tone = TONES[view.tone];
  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-card sm:gap-5 sm:p-6", tone.border)}>
      <span className={cn("self-start rounded-md px-2 py-0.5 text-xs font-medium", tone.tag)}>{view.tag}</span>
      <div className="flex flex-col gap-1.5">
        <p className="text-2xl font-semibold tracking-[-0.02em] sm:text-[28px]">{view.title}</p>
        <p className="text-pretty text-sm leading-relaxed text-zinc-400">{view.sub}</p>
      </div>
      {view.bar && (
        <div className="flex flex-col gap-2">
          <div className="h-1 overflow-hidden rounded-full bg-foreground/[0.08]" role="presentation">
            <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${view.bar.pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{view.bar.from}</span>
            <span>{view.bar.to}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LossList({ title, aiLimit }: { title: string; aiLimit: number }) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <SectionLabel as="p" className="px-0">{title}</SectionLabel>
      <ul className="flex flex-col">
        {losses(aiLimit).map(({ icon: ItemIcon, name, free }) => (
          <li key={name} className="flex items-center gap-3 border-b border-border py-3">
            <ItemIcon size={18} className="shrink-0 text-zinc-500" aria-hidden />
            <span className="flex-1 text-sm text-zinc-200">{name}</span>
            <span className="text-[13px] text-zinc-400">{free}</span>
          </li>
        ))}
      </ul>
      <p className="text-[13px] leading-relaxed text-zinc-500">Apostas, dashboard e saldo por casa continuam no Grátis.</p>
    </div>
  );
}

export default function PlanoPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { me, reloadMe } = useMe();
  const plan = me?.plan ?? null;
  // null = ainda não preenchido com o e-mail da conta. Com "" no lugar, apagar o
  // campo inteiro disparava o preenchimento de novo e o e-mail voltava sozinho.
  const [payerEmailInput, setPayerEmail] = useState<string | null>(null);
  const payerEmail = payerEmailInput ?? "";
  // Edição do e-mail em rascunho: só vale depois do Salvar; Cancelar (ou Esc) descarta.
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Voltou do checkout: quem libera o Pro é o aviso do Mercado Pago, que chega
  // no backend por fora. A tela só descobre perguntando.
  const [waitingSince, setWaitingSince] = useState<number | null>(() =>
    params.get("retorno") === "mercadopago" ? Date.now() : null,
  );

  useEffect(() => {
    if (me && payerEmailInput === null) setPayerEmail(me.email);
  }, [me, payerEmailInput]);

  const subscribed = plan?.subscription === "authorized";

  useEffect(() => {
    if (!waitingSince) return;
    if (subscribed) {
      setWaitingSince(null);
      setParams({}, { replace: true });
      actionToast.success({ title: "Assinatura confirmada", description: "Seu Pro está ativo.", duration: 3500 });
      return;
    }
    if (Date.now() - waitingSince > CONFIRM_POLL_MAX_MS) {
      setWaitingSince(null);
      setParams({}, { replace: true });
      return;
    }
    const poll = setInterval(() => reloadMe(), CONFIRM_POLL_MS);
    return () => clearInterval(poll);
  }, [waitingSince, subscribed, reloadMe, setParams]);

  const startEditEmail = () => {
    setEmailDraft(payerEmail);
    setEmailError(null);
    setEditingEmail(true);
  };
  const cancelEditEmail = () => {
    setEditingEmail(false);
    setEmailError(null);
  };
  const saveEmail = () => {
    const email = emailDraft.trim();
    if (!EMAIL_RE.test(email)) {
      setEmailError("Confira o e-mail: falta o @ ou o domínio.");
      return;
    }
    setPayerEmail(email);
    setEditingEmail(false);
    setEmailError(null);
  };

  const subscribe = async () => {
    setSubscribing(true);
    try {
      const { initPoint } = await postSubscribe(payerEmail.trim());
      window.location.href = initPoint;
    } catch (error) {
      actionToast.error({ description: (error as Error)?.message || "Não deu pra abrir o pagamento agora." });
      setSubscribing(false);
    }
  };

  const cancel = async () => {
    setCancelling(true);
    try {
      await postCancelSubscription();
      setConfirmCancel(false);
      reloadMe();
      actionToast.success({ title: "Assinatura cancelada", description: "O Pro já pago continua até o fim.", duration: 3500 });
    } catch (error) {
      actionToast.error({ description: (error as Error)?.message || "Não deu pra cancelar agora. Tente de novo." });
    } finally {
      setCancelling(false);
    }
  };

  const view = me && plan ? planView(plan, me, Date.now()) : null;
  const action = view?.action ?? null;

  return (
    <MainLayout title="Plano" hideBottomNav mobileHeader={<PageHeader back={() => navigate(-1)} title="Plano" />}>
      {!me ? (
        <FormSkeleton fields={3} />
      ) : !plan || !view ? (
        <p className="text-sm text-zinc-400">Os planos ainda não estão disponíveis. Tente de novo mais tarde.</p>
      ) : (
        <div className="flex max-w-[560px] flex-col gap-6 sm:gap-7">
          <StatusCard view={view} />

          {waitingSince && (
            <div className="flex items-start gap-2 rounded-lg border border-accent/25 bg-accent/[0.07] p-3.5 text-sm">
              <CircleNotch size={16} className="mt-0.5 shrink-0 animate-spin text-accent" />
              <span>
                Confirmando o pagamento com o Mercado Pago. No cartão leva poucos segundos; no Pix ou boleto, o Pro libera assim que o
                pagamento cair.
              </span>
            </div>
          )}

          {view.lossTitle && <LossList title={view.lossTitle} aiLimit={plan.aiDaily?.limit ?? FREE_AI_PER_DAY} />}

          {action?.kind === "subscribe" && (
            // No celular o botão fica preso embaixo, como no design; do sm pra cima segue o fluxo da página.
            <form
              className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
              onSubmit={(e) => {
                e.preventDefault();
                void subscribe();
              }}
            >
              {editingEmail && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="payer-email" className="text-[13px] font-normal text-zinc-400">
                    E-mail pra cobrança
                  </Label>
                  <Input
                    id="payer-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={emailDraft}
                    aria-invalid={!!emailError}
                    aria-describedby="payer-email-hint"
                    className={cn(emailError && "border-danger")}
                    onChange={(e) => {
                      setEmailDraft(e.target.value);
                      setEmailError(null);
                    }}
                    // Enter salva o e-mail (sem isso enviaria o formulário e abriria o pagamento); Esc desiste.
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveEmail();
                      } else if (e.key === "Escape") {
                        cancelEditEmail();
                      }
                    }}
                  />
                  <p id="payer-email-hint" className={cn("text-xs", emailError ? "text-danger" : "text-zinc-500")}>
                    {emailError ?? "Tem conta no Mercado Pago? Use o e-mail dela. Não tem? Dá pra pagar sem conta no próprio checkout."}
                  </p>
                  <div className="mt-1 flex justify-end gap-2">
                    <Button type="button" variant="secondary" size="sm" className="border-transparent text-zinc-400 hover:text-foreground" onClick={cancelEditEmail}>
                      Cancelar
                    </Button>
                    <Button type="button" variant="secondary" size="sm" className="font-semibold" onClick={saveEmail}>
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={subscribing || editingEmail || !payerEmail.trim()}>
                {subscribing ? "Abrindo o Mercado Pago…" : action.label}
              </Button>
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[13px] text-zinc-400">
                <span>{action.note}</span>
                {!editingEmail && (
                  <span className="min-w-0">
                    Cobrança em <span className="break-all text-zinc-200">{payerEmail}</span> ·{" "}
                    <button type="button" onClick={startEditEmail} className="text-accent-text hover:underline underline-offset-4">
                      alterar
                    </button>
                  </span>
                )}
              </div>
              <p className="text-pretty text-xs leading-relaxed text-zinc-500">
                Cartão: renova sozinho todo mês. Pix ou boleto: o Mercado Pago avisa e você paga por lá. Cancele quando quiser.
              </p>
            </form>
          )}

          {action?.kind === "cancel" && (
            <div className="flex flex-col gap-2">
              <Button type="button" variant="secondary" size="lg" className="w-full text-danger" onClick={() => setConfirmCancel(true)}>
                Cancelar assinatura
              </Button>
              <p className="text-pretty text-xs leading-relaxed text-zinc-500">
                A cobrança automática para na hora; o Pro já pago continua até o fim do período, e depois a conta vira Grátis com tudo o que
                você registrou.
              </p>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancelar a assinatura?"
        description={
          plan?.proUntil
            ? `A cobrança automática para. O Pro continua até ${spDate(new Date(plan.proUntil))} e depois a conta vira Grátis, sem perder nada do que você registrou.`
            : "A cobrança automática para e a conta vira Grátis no fim do período pago."
        }
        confirmLabel={cancelling ? "Cancelando…" : "Cancelar assinatura"}
        destructive
        pending={cancelling}
        onConfirm={() => void cancel()}
      />
    </MainLayout>
  );
}
