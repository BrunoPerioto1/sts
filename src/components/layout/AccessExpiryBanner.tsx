import { useState } from "react";
import { Link } from "react-router-dom";
import { Hourglass, X } from "@phosphor-icons/react";
import { useMe } from "@/hooks/queries/use-me";
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
 * Faixa no topo do app nos últimos dias do Pro (teste ou dias pagos sem
 * assinatura) — o lembrete do Telegram não alcança quem não abre o bot. Com
 * assinatura rodando não aparece: a mensalidade renova sozinha. Fechar vale só
 * para esta sessão e para este vencimento: se a data mudar, volta.
 */
export function AccessExpiryBanner() {
  const { me } = useMe();
  const accessUntil = me?.accessUntil ?? null;
  const subscribed = me?.plan?.subscription === "authorized";
  const [dismissed, setDismissed] = useState(readDismissed);
  const days = accessUntil && !isExpired(accessUntil) ? daysUntilAccess(accessUntil) : null;
  const show = !subscribed && days !== null && days <= WARN_DAYS && dismissed !== accessUntil;

  if (!show || !accessUntil) return null;

  const time = new Date(accessUntil).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  const when =
    days === 0 ? `hoje às ${time}`
    : days === 1 ? `amanhã às ${time}`
    : `em ${days} dias (${new Date(accessUntil).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" })} às ${time})`;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, accessUntil); } catch { /* só não lembra */ }
    setDismissed(accessUntil);
  };

  return (
    <div role="status" className="flex items-center gap-3 px-4 sm:px-6 py-2.5 text-sm bg-warning/10 border-b border-warning/25">
      <Hourglass size={16} className="shrink-0 text-warning" aria-hidden="true" />
      <p className="flex-1 min-w-0">
        Seu Pro acaba <span className="font-medium">{when}</span>.
        <span className="text-zinc-400 hidden sm:inline"> Depois a conta vira Grátis, sem perder nada do que você registrou.</span>
      </p>
      <Link
        to="/plano"
        className="press shrink-0 flex items-center gap-1.5 rounded-md border border-warning/30 px-2.5 py-1 text-xs hover:bg-warning/10"
      >
        Assinar
      </Link>
      <button type="button" onClick={dismiss} aria-label="Fechar aviso" className="shrink-0 h-7 w-7 flex items-center justify-center text-zinc-400 hover:text-foreground">
        <X size={14} />
      </button>
    </div>
  );
}
