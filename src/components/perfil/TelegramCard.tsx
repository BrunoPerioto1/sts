import { useState } from "react";
import { TelegramLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { postTelegramLinkCode } from "@/api/routes/post-telegram-link";
import { postUnlinkTelegram } from "@/api/routes/post-unlink-telegram";

// Card do desktop. O fluxo completo (contagem regressiva, polling, dígitos)
// mora na tela /profile/telegram, usada no mobile.
export function TelegramCard({ isLinked, onUnlinked }: { isLinked: boolean; onUnlinked: () => void }) {
  const [linking, setLinking] = useState(false);
  const [code, setCode] = useState("");

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
    <div className="card elev-sm bg-card rounded-md p-[16px]">
      <div className="flex items-center gap-2 mb-1">
        <TelegramLogo size={18} className="text-accent" />
        <h3 className="text-base font-medium">Telegram</h3>
        <span className={`tag ml-auto text-xs px-[10px] py-[3px] rounded-[6px] ${isLinked ? "bg-positive/[0.16] text-positive" : "bg-neutral-800 text-neutral-100"}`}>
          {isLinked ? "Vinculado" : "Não vinculado"}
        </span>
      </div>
      <p className="text-sm opacity-55 mb-3">Registre apostas por mensagem e receba o resumo do dia.</p>
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
    </div>
  );
}
