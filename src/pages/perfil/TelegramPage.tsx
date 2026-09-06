import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, ChatCircleDots, CircleNotch, Clock, PaperPlaneTilt, Sun, Bell } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { actionToast } from "@/lib/action-toast";
import { useMe } from "@/hooks/queries/use-me";
import { postTelegramLinkCode } from "@/api/routes/post-telegram-link";
import { postUnlinkTelegram } from "@/api/routes/post-unlink-telegram";
import { getErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const BOT_HANDLE = "@betbpbot";

const BENEFITS = [
  { icon: ChatCircleDots, title: "Lançar em uma frase", text: "O bot entende casa, valor, mercado e odd de uma mensagem só." },
  { icon: Sun, title: "Resumo do dia", text: "Lucro, pendentes e ROI do dia todo às 21h." },
  { icon: Bell, title: "Sinais filtrados", text: "Só chega o que passa do seu filtro de banca." },
];

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function TelegramPage() {
  const navigate = useNavigate();
  const { me, reloadMe } = useMe();
  const [linking, setLinking] = useState(false);
  const [code, setCode] = useState<{ value: string; expiresAt: Date } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const isLinked = !!me?.telegramUserId;
  const expired = !!code && code.expiresAt.getTime() <= now;

  // Enquanto o código está de pé: relógio pra contagem e um GET no /me a cada
  // 5s — quem confirma a vinculação é o bot, do lado de lá, então a tela só
  // descobre perguntando.
  useEffect(() => {
    if (!code || isLinked) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => reloadMe(), 5000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [code, isLinked, reloadMe]);

  // Vinculou: a tela do código sai de cena sozinha.
  useEffect(() => {
    if (isLinked && code) setCode(null);
  }, [isLinked, code]);

  const generateCode = async () => {
    try {
      setLinking(true);
      const res = await postTelegramLinkCode();
      setCode({ value: res.code, expiresAt: new Date(res.expiresAt) });
      setNow(Date.now());
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao gerar código.") });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    try {
      await postUnlinkTelegram();
      actionToast.success({ title: "Telegram desvinculado" });
      reloadMe();
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao desvincular.") });
    }
  };

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(`/vincular ${code?.value}`);
      actionToast.success({ title: "Linha copiada" });
    } catch {
      /* clipboard é best-effort: o comando está na tela pra digitar */
    }
  };

  const title = code ? "Vincular no Telegram" : "Telegram";

  return (
    <MainLayout
      title={title}
      hideHeaderBorder
      hideBottomNav
      mobileHeader={
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => (code ? setCode(null) : navigate(-1))}
            aria-label="Voltar"
            className="p-1 -ml-1 text-zinc-400 hover:text-white"
          >
            <CaretLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold truncate flex-1">{title}</h1>
          {!code && (
            <span
              className={cn(
                "text-[11px] uppercase tracking-wider px-2 py-1 rounded-md shrink-0",
                isLinked ? "bg-positive/[0.16] text-positive" : "border border-white/10 text-zinc-400"
              )}
            >
              {isLinked ? "Vinculado" : "Não vinculado"}
            </span>
          )}
        </div>
      }
    >
      {!me ? (
        <div className="opacity-55 text-sm">Carregando…</div>
      ) : code ? (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-zinc-400">
            Abra o <span className="text-accent">{BOT_HANDLE}</span> e envie{" "}
            <span className="text-accent">/vincular</span> seguido destes seis dígitos.
          </p>

          <div className="flex gap-2">
            {code.value.split("").map((digit, i) => (
              <span
                key={i}
                className="flex-1 h-14 rounded-lg border border-white/10 bg-card flex items-center justify-center text-xl font-semibold tabular-nums"
              >
                {digit}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock size={15} className="text-zinc-500 shrink-0" />
            {expired ? (
              <span className="text-negative">Código expirado.</span>
            ) : (
              <span className="text-zinc-500">Expira em {formatCountdown(code.expiresAt.getTime() - now)}</span>
            )}
            <span className="text-zinc-600">·</span>
            <button type="button" onClick={generateCode} className="text-accent underline underline-offset-4" disabled={linking}>
              gerar outro
            </button>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">No bot</p>
            <button
              type="button"
              onClick={copyCommand}
              className="press w-full text-left rounded-lg border border-accent/25 bg-accent/[0.08] p-3.5"
            >
              <span className="block text-sm text-accent-100 tabular-nums">/vincular {code.value}</span>
              <span className="block text-xs text-zinc-500 mt-0.5">Toque para copiar a linha inteira.</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <CircleNotch size={16} className="animate-spin text-accent shrink-0" />
            Esperando a confirmação do bot…
          </div>

          <Button variant="outline" className="w-full min-h-[48px]" onClick={() => setCode(null)}>
            Cancelar vinculação
          </Button>
          <p className="text-center text-xs text-zinc-500 -mt-2">Esta tela fecha sozinha quando o bot confirmar.</p>
        </div>
      ) : isLinked ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
              <PaperPlaneTilt size={18} className="text-accent" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-medium text-white truncate">Conta vinculada</p>
              <p className="text-sm text-zinc-500 truncate">
                {me.telegramLinkedAt
                  ? `vinculado em ${new Date(me.telegramLinkedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
                  : `ID ${me.telegramUserId}`}
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-400">
            O bot registra apostas por mensagem, manda o resumo do dia e filtra os sinais pelo seu percentual de banca.
            O que ele envia se ajusta no próprio bot.
          </p>

          <Button variant="outline" className="w-full min-h-[48px] gap-2" asChild>
            <a href={`https://t.me/${BOT_HANDLE.replace("@", "")}`} target="_blank" rel="noreferrer">
              Abrir conversa
            </a>
          </Button>

          <button type="button" onClick={handleUnlink} className="press w-full h-12 text-sm text-negative">
            Desvincular
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <PaperPlaneTilt size={26} className="text-accent" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Registre apostas por mensagem</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Vincule sua conta para lançar apostas em uma frase, receber o resumo do dia e ser avisado quando um sinal
              passar do seu filtro de banca.
            </p>
          </div>

          <div className="flex flex-col divide-y divide-border border-y border-border">
            {BENEFITS.map((item) => (
              <div key={item.title} className="flex items-start gap-3 py-3.5">
                <item.icon size={18} className="text-zinc-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-white">{item.title}</p>
                  <p className="text-xs text-zinc-500">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Exemplo de mensagem</p>
            <p className="rounded-lg bg-white/[0.04] p-3.5 text-sm text-zinc-300">
              “100 na Betano, Flamengo vitória, odd 2.10”
            </p>
          </div>

          <Button
            className="w-full min-h-[48px] bg-blue-600 text-white font-semibold hover:bg-blue-600/90"
            onClick={generateCode}
            disabled={linking}
          >
            {linking ? "Gerando…" : "Gerar código de vinculação"}
          </Button>
          <p className="text-center text-xs text-zinc-500 -mt-2">
            Você recebe seis dígitos para enviar ao {BOT_HANDLE} com o comando /vincular.
          </p>
        </div>
      )}
    </MainLayout>
  );
}
