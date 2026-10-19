import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, CircleNotch, Minus, Sparkle } from "@phosphor-icons/react";
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
import type { PlanSummary } from "@/api/routes/get-me";
import { actionToast } from "@/lib/action-toast";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

// Quanto a tela espera o Mercado Pago confirmar depois da volta do checkout.
// O cartão costuma confirmar em segundos; Pix e boleto só quando forem pagos.
const CONFIRM_POLL_MS = 5000;
const CONFIRM_POLL_MAX_MS = 3 * 60 * 1000;

const ROWS: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Registro digitado (site e bot)", free: "ilimitado", pro: "ilimitado" },
  { label: "Leitura de print e áudio por IA", free: "5 por dia", pro: "ilimitada" },
  { label: "Dashboard, saldo por casa e comparador", free: true, pro: true },
  { label: "Conferência pelo placar", free: false, pro: true },
  { label: "Exportação em CSV", free: false, pro: true },
  { label: "Planilhar tips do grupo", free: false, pro: true },
];

const spDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check size={16} weight="bold" className="text-success" aria-label="incluído" />;
  if (value === false) return <Minus size={16} className="text-zinc-600" aria-label="não incluído" />;
  return <span className="text-xs text-zinc-300">{value}</span>;
}

/** Uma linha sobre o plano de agora: é o que a pessoa procura ao abrir a tela. */
function CurrentPlan({ plan }: { plan: PlanSummary }) {
  const subscribed = plan.subscription === "authorized";
  const title = plan.plan === "pro" ? "Pro" : "Grátis";
  const detail =
    plan.plan === "pro"
      ? subscribed
        ? `Assinatura ativa. A mensalidade renova sozinha${plan.proUntil ? `; pago até ${spDate(plan.proUntil)}` : ""}.`
        : plan.subscription === "cancelled" && plan.proUntil
          ? `Assinatura cancelada. O Pro continua até ${spDate(plan.proUntil)} e depois a conta vira Grátis.`
          : plan.proUntil
            ? `Pro até ${spDate(plan.proUntil)}. Depois disso a conta vira Grátis, sem perder nada do que você registrou.`
            : "Pro sem prazo."
      : plan.aiDaily
        ? `Hoje: ${plan.aiDaily.used} de ${plan.aiDaily.limit} leituras por IA. O registro digitado não tem limite.`
        : "";

  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          plan.plan === "pro" ? "bg-accent/15 text-accent" : "bg-foreground/[0.06] text-zinc-400",
        )}
      >
        <Sparkle size={18} weight={plan.plan === "pro" ? "fill" : "regular"} />
      </span>
      <div className="min-w-0">
        <p className="text-base font-medium">Plano {title}</p>
        <p className="text-sm text-zinc-400">{detail}</p>
      </div>
    </div>
  );
}

export default function PlanoPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { me, reloadMe } = useMe();
  const plan = me?.plan ?? null;
  const [payerEmail, setPayerEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Voltou do checkout: quem libera o Pro é o aviso do Mercado Pago, que chega
  // no backend por fora. A tela só descobre perguntando.
  const [waitingSince, setWaitingSince] = useState<number | null>(() =>
    params.get("retorno") === "mercadopago" ? Date.now() : null,
  );

  useEffect(() => {
    if (me && !payerEmail) setPayerEmail(me.email);
  }, [me, payerEmail]);

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

  const trialEnd = plan?.plan === "pro" && !plan.subscription && plan.proUntil ? spDate(plan.proUntil) : null;

  return (
    <MainLayout title="Plano" hideBottomNav mobileHeader={<PageHeader back={() => navigate(-1)} title="Plano" />}>
      {!me ? (
        <FormSkeleton fields={3} />
      ) : !plan ? (
        <p className="text-sm text-zinc-400">Os planos ainda não estão disponíveis. Tente de novo mais tarde.</p>
      ) : (
        <div className="flex flex-col gap-6 max-w-xl">
          <CurrentPlan plan={plan} />

          {waitingSince && (
            <div className="flex items-start gap-2 rounded-lg border border-accent/25 bg-accent/[0.07] p-3.5 text-sm">
              <CircleNotch size={16} className="animate-spin text-accent shrink-0 mt-0.5" />
              <span>
                Confirmando o pagamento com o Mercado Pago. No cartão leva poucos segundos; no Pix ou boleto, o Pro
                libera assim que o pagamento cair.
              </span>
            </div>
          )}

          <div>
            <SectionLabel as="p" className="mb-2">Grátis × Pro</SectionLabel>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500">
                  <th className="text-left font-normal py-2" />
                  <th className="font-normal py-2 w-24">Grátis</th>
                  <th className="font-normal py-2 w-28 text-foreground">
                    Pro <span className="text-zinc-500">· {formatMoney(plan.price)}/mês</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border border-y border-border">
                {ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className="py-3 pr-3 text-zinc-300">{row.label}</td>
                    <td className="py-3 text-center"><span className="inline-flex justify-center"><Cell value={row.free} /></span></td>
                    <td className="py-3 text-center"><span className="inline-flex justify-center"><Cell value={row.pro} /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-zinc-500 mt-2">O grupo de tips do Telegram é vendido à parte.</p>
          </div>

          {subscribed ? (
            <button type="button" onClick={() => setConfirmCancel(true)} className="press w-full h-12 text-sm text-danger">
              Cancelar assinatura
            </button>
          ) : (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void subscribe();
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payer-email" className="text-[13px] font-normal text-zinc-400">
                  E-mail da sua conta do Mercado Pago
                </Label>
                <Input
                  id="payer-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                />
                <p className="text-xs text-zinc-500">O Mercado Pago pede login com este e-mail na hora de pagar.</p>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={subscribing || !payerEmail.trim()}>
                {subscribing ? "Abrindo o Mercado Pago…" : `Assinar o Pro · ${formatMoney(plan.price)}/mês`}
              </Button>
              <p className="text-xs text-zinc-500 leading-relaxed">
                No cartão de crédito a mensalidade é cobrada sozinha todo mês. No Pix ou boleto, o Mercado Pago avisa
                todo mês e você paga por lá. Cancele quando quiser.
                {trialEnd && ` Seu teste vai até ${trialEnd}: a primeira cobrança fica pra essa data.`}
              </p>
            </form>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancelar a assinatura?"
        description={
          plan?.proUntil
            ? `A cobrança automática para. O Pro continua até ${spDate(plan.proUntil)} e depois a conta vira Grátis, sem perder nada do que você registrou.`
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
