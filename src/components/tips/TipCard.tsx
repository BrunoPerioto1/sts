import { useState } from "react";
import {
  ArrowSquareOut,
  ArrowCounterClockwise,
  Check,
  DotsThree,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TipItem } from "@/api/routes/get-tips";

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2).replace(".", ",")}%`;
}

const squareButtonClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-zinc-300 transition-colors hover:bg-foreground/[0.07] disabled:opacity-40";

// Uma linha da fila. Densa de propósito: o que decide a aposta (odd, EV,
// jogo, mercado) tem que caber sem rolar, e a ação principal é um alvo só.
export function TipCard({
  tip,
  onDismiss,
  onUndismiss,
  onPlanilhar,
}: {
  tip: TipItem;
  onDismiss: () => void;
  onUndismiss: () => void;
  onPlanilhar: () => void;
}) {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <article className="border-b border-border px-4 py-3.5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-500">
            {formatTime(tip.createdAt)}
            {tip.house && ` · ${tip.house}`}
          </p>
          <h3 className="mt-1 text-[17px] font-semibold leading-tight text-white">
            {tip.game ?? "Jogo não identificado"}
          </h3>
          {tip.market && <p className="mt-0.5 text-sm text-zinc-400">{tip.market}</p>}
        </div>

        <div className="shrink-0 text-right">
          {tip.odd !== null && (
            <p className="text-2xl font-semibold leading-none tabular-nums">{tip.odd.toFixed(2)}</p>
          )}
          {tip.percent !== null && (
            <p className="mt-1 text-xs font-semibold tabular-nums text-green-400">
              {formatPercent(tip.percent)}
            </p>
          )}
        </div>
      </div>

      {tip.isAviso && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
          <Warning size={14} weight="fill" /> SOBRECARGA — confira a odd na casa antes de apostar
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button
          asChild={!!tip.link}
          size="lg"
          disabled={!tip.link}
          className="h-11 flex-1 border-transparent bg-accent text-white hover:bg-accent-700"
        >
          {tip.link ? (
            // noreferrer junto do _blank: sem ele a aba da casa recebe
            // window.opener e pode navegar esta de volta.
            <a href={tip.link} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOut size={16} weight="bold" />
              {tip.recommendedStake !== null
                ? `Apostar  ${formatCurrency(tip.recommendedStake)}`
                : "Abrir na casa"}
            </a>
          ) : (
            <span>Sem link da casa</span>
          )}
        </Button>

        {tip.status === "caiu" ? (
          <button type="button" onClick={onUndismiss} className={squareButtonClass} aria-label="Devolver para a fila">
            <ArrowCounterClockwise size={18} weight="bold" />
          </button>
        ) : (
          tip.status === "pending" && (
            <button type="button" onClick={onPlanilhar} className={squareButtonClass} aria-label="Planilhar">
              <Check size={18} weight="bold" />
            </button>
          )
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className={squareButtonClass} aria-label="Mais ações">
            <DotsThree size={20} weight="bold" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setShowMessage((v) => !v)}>
              {showMessage ? "Esconder mensagem" : "Ver mensagem do canal"}
            </DropdownMenuItem>
            {tip.status === "pending" && (
              <DropdownMenuItem onSelect={onDismiss} className="text-negative">
                <XCircle size={15} weight="bold" /> Marcar como caiu
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showMessage && (
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-black/30 p-2.5 text-xs leading-relaxed text-zinc-400">
          {tip.text}
        </pre>
      )}

      {tip.status !== "pending" && (
        <p className={cn("mt-2 text-xs", tip.status === "planilhada" ? "text-green-400" : "text-zinc-500")}>
          {tip.status === "planilhada" ? "Planilhada" : "Marcada como caiu"}
        </p>
      )}
    </article>
  );
}
