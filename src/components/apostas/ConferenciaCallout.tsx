import { Link } from "react-router-dom";
import { CaretRight, ClipboardText } from "@phosphor-icons/react";
import { useSettlementQueue } from "@/hooks/apostas/use-settlement";

/**
 * Atalho pra conferência no topo da lista de apostas.
 *
 * A proposta do bot não aparece na lista — ali a aposta continua "Pendente" até
 * o usuário confirmar. Sem esse aviso, o lote esperava numa tela que ele só
 * abriria se lembrasse que ela existe.
 */
export function ConferenciaCallout() {
  const { data: fila } = useSettlementQueue();
  const n = fila?.suggestions ?? 0;
  if (!n) return null;

  return (
    <Link
      to="/settlement"
      className="flex items-center gap-3 rounded-xl border border-accent/25 bg-accent/[0.07] px-3 py-2.5 transition-colors hover:bg-accent/[0.11]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <ClipboardText size={18} weight="fill" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {n} resultado{n === 1 ? "" : "s"} pra conferir
        </span>
        <span className="block truncate text-xs text-zinc-400">
          Confirme para virar lucro
        </span>
      </span>
      <CaretRight size={16} className="shrink-0 text-zinc-500" />
    </Link>
  );
}
