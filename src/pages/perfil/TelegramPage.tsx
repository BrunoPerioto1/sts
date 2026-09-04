import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, TelegramLogo } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { actionToast } from "@/lib/action-toast";
import { useMe } from "@/hooks/queries/use-me";
import { postTelegramLinkCode } from "@/api/routes/post-telegram-link";
import { postUnlinkTelegram } from "@/api/routes/post-unlink-telegram";
import { getErrorMessage } from "@/lib/api-error";

export default function TelegramPage() {
  const navigate = useNavigate();
  const { me, reloadMe } = useMe();
  const [linking, setLinking] = useState(false);
  const [code, setCode] = useState<string>("");

  const handleGenerateTelegramCode = async () => {
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

  const handleUnlinkTelegram = async () => {
    try {
      await postUnlinkTelegram();
      actionToast.success({ title: "Telegram desvinculado" });
      reloadMe();
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao desvincular.") });
    }
  };

  const isLinked = !!me?.telegramUserId;

  return (
    <MainLayout
      title="Telegram"
      hideHeaderBorder
      hideBottomNav
      mobileHeader={
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={() => navigate(-1)} aria-label="Voltar" className="p-1 -ml-1 text-zinc-400 hover:text-white">
            <CaretLeft size={20} />
          </button>
          <h1 className="text-base font-semibold truncate">Telegram</h1>
        </div>
      }
    >
      {!me ? (
        <div className="opacity-55 text-sm">Carregando…</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TelegramLogo size={18} className="text-accent" />
            <span className={`tag ml-auto text-xs px-[10px] py-[3px] rounded-[6px] ${isLinked ? "bg-positive/[0.16] text-positive" : "bg-neutral-800 text-neutral-100"}`}>
              {isLinked ? "Vinculado" : "Não vinculado"}
            </span>
          </div>
          <p className="text-sm text-zinc-500">Registre apostas por mensagem e receba o resumo do dia.</p>

          {isLinked ? (
            <Button variant="outline" size="sm" onClick={handleUnlinkTelegram}>Desvincular</Button>
          ) : (
            <div className="space-y-2">
              <Button size="sm" onClick={handleGenerateTelegramCode} disabled={linking}>
                {linking ? "Gerando…" : "Vincular Telegram"}
              </Button>
              {code && <p className="text-sm">Código: <span className="font-mono">{code}</span> — envie <span className="font-mono">/vincular {code}</span> no bot.</p>}
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
