import { useEffect, useState, type ReactNode } from "react";
import { ArrowSquareOut, Copy, LinkBreak, LinkSimple, PaperPlaneTilt } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { UNLINK_TELEGRAM_WARNING } from "@/lib/telegram-unlink";
import { BOT_URL } from "@/lib/telegram-bot";
import { cn } from "@/lib/utils";
import { postTelegramLinkCode } from "@/api/routes/post-telegram-link";
import { postUnlinkTelegram } from "@/api/routes/post-unlink-telegram";
import { useMe } from "@/hooks/queries/use-me";
import type { MeResponse } from "@/api/routes/get-me";
import { SETTINGS_CARD } from "./SettingsSection";

type Tone = "neutral" | "success" | "warning";

const PILL_TONE: Record<Tone, { pill: string; dot: string }> = {
  neutral: { pill: "border-foreground/10 bg-foreground/[0.04] text-zinc-400", dot: "bg-zinc-500" },
  success: { pill: "border-success/25 bg-success/10 text-success", dot: "bg-success" },
  warning: { pill: "border-warning/25 bg-warning/10 text-warning", dot: "bg-warning" },
};

function StatusPill({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-normal", PILL_TONE[tone].pill)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", PILL_TONE[tone].dot)} />
      {children}
    </span>
  );
}

// Card do desktop, numa linha só: não vinculado → código gerado → vinculado.
// A tela /profile/telegram (celular) tem o fluxo com contagem e dígitos.
export function TelegramCard({ me }: { me: MeResponse }) {
  const { reloadMe } = useMe();
  const [linking, setLinking] = useState(false);
  const [code, setCode] = useState<{ value: string; expiresAt: number } | null>(null);
  const [expired, setExpired] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const isLinked = !!me.telegramUserId;
  const command = code ? `/vincular ${code.value}` : "";

  // Quem confirma a vinculação é o bot, do lado de lá: enquanto o código vale,
  // a tela pergunta ao /me a cada 5s. Venceu, para de perguntar.
  useEffect(() => {
    if (!code || isLinked) return;
    const poll = setInterval(() => reloadMe(), 5000);
    const expire = setTimeout(() => setExpired(true), Math.max(0, code.expiresAt - Date.now()));
    return () => {
      clearInterval(poll);
      clearTimeout(expire);
    };
  }, [code, isLinked, reloadMe]);

  useEffect(() => {
    if (isLinked && code) {
      setCode(null);
      actionToast.success({ title: "Telegram vinculado" });
    }
  }, [isLinked, code]);

  const copyCommand = async (line: string) => {
    try {
      await navigator.clipboard.writeText(line);
      return true;
    } catch {
      return false; // clipboard é best-effort: o comando está na tela pra digitar
    }
  };

  const handleGenerate = async () => {
    try {
      setLinking(true);
      const res = await postTelegramLinkCode();
      setCode({ value: res.code, expiresAt: new Date(res.expiresAt).getTime() });
      setExpired(false);
      const copied = await copyCommand(`/vincular ${res.code}`);
      actionToast.success({
        title: "Código gerado",
        description: copied ? "O comando já está copiado: é só colar no bot." : `Envie /vincular ${res.code} no bot.`,
      });
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao gerar código.") });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await postUnlinkTelegram();
      actionToast.success({ title: "Telegram desvinculado" });
      setConfirmUnlink(false);
      reloadMe();
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao desvincular.") });
    } finally {
      setUnlinking(false);
    }
  };

  const waiting = !isLinked && !!code && !expired;

  let status: { tone: Tone; label: string };
  let detail: ReactNode;
  let action: ReactNode;

  if (isLinked) {
    status = { tone: "success", label: "Vinculado" };
    // Nem toda conta do Telegram tem @; sem ele, o texto genérico.
    const handle = me.telegramUsername ? `@${me.telegramUsername}` : "Conta vinculada";
    const since = me.telegramLinkedAt ? ` · desde ${new Date(me.telegramLinkedAt).toLocaleDateString("pt-BR")}` : "";
    detail = `${handle}${since}`;
    action = (
      <Button variant="secondary" size="sm" onClick={() => setConfirmUnlink(true)}>
        <LinkBreak /> Desvincular
      </Button>
    );
  } else if (waiting) {
    status = { tone: "warning", label: "Aguardando código" };
    detail = (
      <span className="flex items-center gap-1.5">
        Envie
        <button
          type="button"
          onClick={async () => {
            if (await copyCommand(command)) actionToast.success({ title: "Comando copiado" });
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-foreground/10 bg-foreground/[0.04] px-2 py-0.5 font-mono text-[13px] text-foreground hover:bg-foreground/[0.08] transition-colors"
          aria-label={`Copiar ${command}`}
        >
          {command}
          <Copy size={13} className="text-zinc-400" />
        </button>
        no bot
      </span>
    );
    action = (
      <Button size="sm" asChild>
        <a href={BOT_URL} target="_blank" rel="noreferrer">
          <ArrowSquareOut /> Abrir bot
        </a>
      </Button>
    );
  } else {
    status = { tone: "neutral", label: code ? "Código expirado" : "Não vinculado" };
    detail = code ? "O código venceu. Gere outro pra vincular." : "Nenhuma conta conectada";
    action = (
      <Button size="sm" onClick={handleGenerate} loading={linking}>
        {!linking && <LinkSimple />}
        {linking ? "Gerando…" : code ? "Gerar outro código" : "Vincular Telegram"}
      </Button>
    );
  }

  return (
    <div className={cn(SETTINGS_CARD, "flex items-center gap-3 px-5 py-4")}>
      <span className="h-10 w-10 shrink-0 rounded-lg bg-accent/10 flex items-center justify-center text-accent-text" aria-hidden="true">
        <PaperPlaneTilt size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium">
          Telegram
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </p>
        <div className="text-[13px] text-zinc-400 mt-1 truncate">{detail}</div>
      </div>
      {action}

      <ConfirmDialog
        open={confirmUnlink}
        onOpenChange={setConfirmUnlink}
        title="Desvincular o Telegram?"
        description={UNLINK_TELEGRAM_WARNING}
        confirmLabel={unlinking ? "Desvinculando…" : "Desvincular"}
        destructive
        pending={unlinking}
        onConfirm={() => void handleUnlink()}
      />
    </div>
  );
}
