import {
  ArrowSquareOut,
  ArrowCounterClockwise,
  Check,
  Clock,
  PencilSimple,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatTime } from "@/lib/format";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { TipItem } from "@/api/routes/get-tips";

const timeChipClass =
  "inline-flex items-center gap-1 h-6 rounded-full border border-white/15 bg-white/10 px-2.5 text-xs font-semibold tabular-nums text-white shrink-0";
const houseChipClass =
  "inline-flex items-center min-w-0 h-6 text-xs leading-none px-2.5 rounded-full border border-accent/25 bg-accent/[0.08] text-accent-100";

const statusStrip: Record<TipItem["status"], string> = {
  pending: "bg-accent-700",
  planilhada: "bg-green-500",
  caiu: "bg-red-500/60",
};

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2).replace(".", ",")}%`;
}

export function TipCard({
  tip,
  index = 0,
  onDismiss,
  onUndismiss,
  onPlanilhar,
  onEdit,
  busy,
}: {
  tip: TipItem;
  index?: number;
  onDismiss: () => void;
  onUndismiss: () => void;
  onPlanilhar: () => void;
  onEdit: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="animate-rise stagger relative overflow-hidden rounded-lg bg-card p-3 pr-4 flex flex-col gap-2"
      style={{ boxShadow: "var(--shadow-sm)", ...stagger(index) }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={timeChipClass}>
          <Clock size={12} weight="bold" /> {formatTime(tip.createdAt)}
        </span>
        {tip.house && (
          <span className={houseChipClass} title={tip.house}>
            <span className="truncate">{tip.house}</span>
          </span>
        )}
        <div className="ml-auto flex items-baseline gap-2 shrink-0">
          {tip.odd !== null && <span className="text-lg font-semibold tabular-nums">{tip.odd.toFixed(2)}</span>}
          {tip.percent !== null && (
            <span className="text-xs font-semibold tabular-nums text-green-400">{formatPercent(tip.percent)}</span>
          )}
        </div>
      </div>

      <p className="text-base font-medium text-white">{tip.game ?? "Jogo não identificado"}</p>
      {tip.market && <p className="text-sm text-zinc-400">{tip.market}</p>}

      {tip.isAviso && (
        <p className="flex items-center gap-1.5 text-xs text-amber-400">
          <Warning size={14} weight="fill" /> SOBRECARGA — confira a odd na casa antes de apostar
        </p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-500 tabular-nums">
        {tip.potentialProfit !== null && (
          <span>
            Lucro potencial <span className="text-zinc-300">{formatCurrency(tip.potentialProfit)}</span>
          </span>
        )}
        {tip.limit !== null && <span>Limite {formatCurrency(tip.limit)}</span>}
      </div>

      <div className="flex items-center gap-2 pt-1">
        {tip.link && (
          <Button
            asChild
            size="sm"
            className="flex-1 sm:flex-none sm:min-w-[200px] border-transparent bg-accent text-white hover:bg-accent-700"
          >
            {/* noreferrer junto do _blank: sem ele a aba da casa recebe
                window.opener e pode navegar esta de volta. */}
            <a href={tip.link} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOut size={14} weight="bold" />
              {tip.recommendedStake !== null ? `Apostar ${formatCurrency(tip.recommendedStake)}` : "Abrir na casa"}
            </a>
          </Button>
        )}
        {tip.status === "caiu" && (
          <Button variant="outline" size="sm" onClick={onUndismiss} disabled={busy} className={cn(!tip.link && "flex-1")}>
            <ArrowCounterClockwise size={14} weight="bold" /> Devolver
          </Button>
        )}
      </div>

      {tip.status === "pending" && (
        <div className="flex items-center gap-2">
          {/* Planilhar grava na hora, sem confirmação — o clique é a
              confirmação, igual ao botão do /pendentes no bot. Editar é pra
              quando a casa deu outra odd ou você apostou outro valor. */}
          <Button variant="outline" size="sm" onClick={onPlanilhar} disabled={busy} className="flex-1">
            <Check size={14} weight="bold" /> Planilhar
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} disabled={busy}>
            <PencilSimple size={14} weight="bold" /> Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={onDismiss} disabled={busy}>
            <XCircle size={14} weight="bold" /> Caiu
          </Button>
        </div>
      )}

      {/* A mensagem como ela chegou no Telegram. O card mostra o que dá pra
          decidir de relance; quem quiser conferir uma linha que o parser não
          extraiu (ADM, odd justa, free bet) abre aqui. */}
      <details className="group">
        <summary className="cursor-pointer list-none text-xs text-zinc-500 hover:text-zinc-300 select-none">
          <span className="group-open:hidden">Ver mensagem do canal</span>
          <span className="hidden group-open:inline">Esconder mensagem</span>
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-black/30 p-2.5 text-xs leading-relaxed text-zinc-400">
          {tip.text}
        </pre>
      </details>

      <div className={cn("absolute inset-y-0 right-0 w-[6px] rounded-r-lg", statusStrip[tip.status])} />
    </div>
  );
}
