import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Hourglass, X } from "@phosphor-icons/react";
import { getMyBilling, postMyPaymentClaim } from "@/api/routes/get-billing";
import { useMe } from "@/hooks/queries/use-me";
import { actionToast } from "@/lib/action-toast";
import { daysUntilAccess, isExpired } from "@/lib/access";

// Mesmos marcos do lembrete do Telegram (3 dias, amanhã, hoje).
const WARN_DAYS = 3;
const DISMISS_KEY = "access-banner-dismissed";

function readDismissed(): string | null {
  try {
    return sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

/**
 * Faixa no topo do app nos últimos dias antes de vencer, com a chave PIX à mão
 * — o lembrete do Telegram não alcança quem não abre o bot. Fechar vale só
 * para esta sessão e para este vencimento: se o admin mudar a data, volta.
 */
export function AccessExpiryBanner() {
  const { me } = useMe();
  const accessUntil = me?.accessUntil ?? null;
  const [dismissed, setDismissed] = useState(readDismissed);
  const days = accessUntil && !isExpired(accessUntil) ? daysUntilAccess(accessUntil) : null;
  const show = days !== null && days <= WARN_DAYS && dismissed !== accessUntil;

  const queryClient = useQueryClient();
  // PIX copia-e-cola da conta (valor + identificador), não só a chave.
  const billing = useQuery({ queryKey: ["access", "billing", "me"], queryFn: getMyBilling, enabled: show, staleTime: Infinity });

  if (!show || !accessUntil) return null;

  const time = new Date(accessUntil).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  const when =
    days === 0 ? `hoje às ${time}`
    : days === 1 ? `amanhã às ${time}`
    : `em ${days} dias (${new Date(accessUntil).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" })} às ${time})`;
  const pixText = billing.data?.pixCode ?? billing.data?.pixKey;
  const price = billing.data?.price;
  const claimed = !!billing.data?.paymentClaimedAt;

  const claim = async () => {
    try {
      await postMyPaymentClaim();
      void queryClient.invalidateQueries({ queryKey: ["access", "billing", "me"] });
      actionToast.success({ title: "Administrador avisado", description: "O vencimento é estendido assim que ele conferir." });
    } catch {
      actionToast.error({ description: "Não deu pra avisar agora. Tente de novo." });
    }
  };

  const copy = async () => {
    if (!pixText) return;
    try {
      await navigator.clipboard.writeText(pixText);
      actionToast.success({ title: billing.data?.pixCode ? "PIX copia e cola copiado" : "Chave PIX copiada" });
    } catch {
      /* clipboard é best-effort; a chave continua na tela de renovação */
    }
  };

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, accessUntil); } catch { /* só não lembra */ }
    setDismissed(accessUntil);
  };

  return (
    <div role="status" className="flex items-center gap-3 px-4 sm:px-6 py-2.5 text-sm bg-amber-500/10 border-b border-amber-500/25">
      <Hourglass size={16} className="shrink-0 text-amber-400" aria-hidden="true" />
      <p className="flex-1 min-w-0">
        Seu acesso vence <span className="font-medium">{when}</span>.
        {price != null && (
          <span className="text-zinc-400"> Renove com {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} no PIX.</span>
        )}
      </p>
      {pixText && (
        <button
          type="button"
          onClick={copy}
          className="press shrink-0 flex items-center gap-1.5 rounded-md border border-amber-500/30 px-2.5 py-1 text-xs hover:bg-amber-500/10"
        >
          <Copy size={13} /> Copiar PIX
        </button>
      )}
      {pixText && !claimed && (
        <button
          type="button"
          onClick={claim}
          className="press shrink-0 hidden sm:flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-zinc-300 hover:bg-amber-500/10"
        >
          Já paguei
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label="Fechar aviso" className="shrink-0 h-7 w-7 flex items-center justify-center text-zinc-400 hover:text-foreground">
        <X size={14} />
      </button>
    </div>
  );
}
