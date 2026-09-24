import { useState } from "react";
import { TelegramLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { postTelegramLinkCode } from "@/api/routes/post-telegram-link";
import { postUnlinkTelegram } from "@/api/routes/post-unlink-telegram";
import type { MeResponse } from "@/api/routes/get-me";

// Card do desktop. O fluxo completo (contagem regressiva, polling, dígitos)
// mora na tela /profile/telegram, usada no mobile.
export function TelegramCard({ me, onUnlinked }: { me: MeResponse; onUnlinked: () => void }) {
  const [linking, setLinking] = useState(false);
  const [code, setCode] = useState("");
  const isLinked = !!me.telegramUserId;

  const handleGenerate = async () => {
    try {
      setLinking(true);
      const res = await postTelegramLinkCode();
      setCode(res.code);
      try { await navigator.clipboard.writeText(res.code); } catch { /* clipboard write is best-effort */ }
      actionToast.success({ title: "Código gerado", description: `Use no bot: /vincular ${res.code}` });
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
      onUnlinked();
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao desvincular.") });
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-labelledby="telegram-title">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="h-8 w-8 rounded-lg bg-foreground/[0.06] flex items-center justify-center text-zinc-300" aria-hidden="true">
          <TelegramLogo size={16} />
        </span>
        <h2 id="telegram-title" className="text-base font-semibold">Telegram</h2>
      </div>

      {/* Nem toda conta do Telegram tem @; sem ele, o texto genérico. */}
      <div className="rounded-lg bg-foreground/[0.04] px-3 py-2.5 mb-3">
        <p className="flex items-center gap-2 text-sm font-medium min-w-0">
          <span className="truncate">{!isLinked ? "Nenhuma conta" : me.telegramUsername ? `@${me.telegramUsername}` : "Conta vinculada"}</span>
          <span className={`flex shrink-0 items-center gap-1 text-xs font-normal ${isLinked ? "text-positive" : "text-zinc-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isLinked ? "bg-positive" : "bg-zinc-500"}`} />
            {isLinked ? "Vinculado" : "Não vinculado"}
          </span>
        </p>
        {isLinked && me.telegramLinkedAt && (
          <p className="text-xs text-zinc-500 mt-0.5">desde {new Date(me.telegramLinkedAt).toLocaleDateString("pt-BR")}</p>
        )}
      </div>

      <p className="text-[13px] text-zinc-400 mb-3">Registre apostas por mensagem e receba o resumo do dia.</p>
      {isLinked ? (
        <Button variant="outline" size="sm" onClick={handleUnlink}>Desvincular</Button>
      ) : (
        <div className="space-y-2">
          <Button size="sm" onClick={handleGenerate} disabled={linking}>
            {linking ? "Gerando…" : "Vincular Telegram"}
          </Button>
          {code && <p className="text-sm">Código: <span className="font-mono">{code}</span> — envie <span className="font-mono">/vincular {code}</span> no bot.</p>}
        </div>
      )}
    </section>
  );
}
