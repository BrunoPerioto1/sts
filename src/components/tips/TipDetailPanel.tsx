import {
  ArrowCounterClockwise,
  ArrowSquareOut,
  CaretRight,
  Check,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TipItem } from "@/api/routes/get-tips";

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider opacity-40">{label}</p>
      <p className={cn("mt-1 truncate text-lg font-semibold tabular-nums", className)}>{value}</p>
    </div>
  );
}

// Painel fixo à direita da fila. Só mostra o que a tip realmente tem: os
// campos saem todos do texto da mensagem, e o que o extrator não achou vira
// "—" em vez de bloco vazio.
export function TipDetailPanel({
  tip,
  onPlanilhar,
  onDismiss,
  onUndismiss,
}: {
  tip: TipItem;
  onPlanilhar: () => void;
  onDismiss: () => void;
  onUndismiss: () => void;
}) {
  const meta = [tip.sport, tip.house].filter(Boolean).join(" · ");

  return (
    <aside className="sticky top-20 flex max-h-[calc(100vh-7rem)] flex-col rounded-xl border border-border">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2 text-xs opacity-50">
          <Badge
            variant={
              tip.status === "planilhada" ? "won" : tip.status === "caiu" ? "canceled" : "pending"
            }
          >
            {tip.status === "planilhada" ? "Planilhada" : tip.status === "caiu" ? "Caiu" : "Pendente"}
          </Badge>
          <span>recebida {formatTime(tip.createdAt)}</span>
        </div>

        <h2 className="mt-3 text-xl font-semibold leading-tight">
          {tip.game ?? "Jogo não identificado"}
        </h2>
        {tip.market && <p className="mt-1 text-sm opacity-70">{tip.market}</p>}
        {meta && <p className="mt-1 text-xs opacity-45">{meta}</p>}

        {tip.isAviso && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-400">
            <Warning size={14} weight="fill" /> SOBRECARGA — confira a odd na casa antes de apostar
          </p>
        )}
      </div>

      {/* min-h-0 junto do flex-1: sem ele o filho com overflow cresce além do
          container e a rolagem vai parar na página inteira. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Odd" value={tip.odd?.toFixed(2) ?? "—"} />
          <Stat
            label="Stake sugerida"
            value={tip.recommendedStake !== null ? formatCurrency(tip.recommendedStake) : "—"}
          />
          <Stat
            label="% da banca"
            value={tip.percent !== null ? `${tip.percent.toFixed(2).replace(".", ",")}%` : "—"}
            className="text-positive"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <Stat
            label="Lucro potencial"
            value={tip.potentialProfit !== null ? formatCurrency(tip.potentialProfit) : "—"}
            className="text-positive"
          />
          <Stat
            label="Limite"
            value={tip.limit !== null ? formatCurrency(tip.limit) : "—"}
          />
        </div>

        {tip.link && (
          <Button
            asChild
            className="mt-5 w-full justify-center gap-2 border-transparent bg-accent text-white hover:bg-accent-700"
          >
            {/* noreferrer junto do _blank: sem ele a aba da casa recebe
                window.opener e pode navegar esta de volta. */}
            <a href={tip.link} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOut size={16} weight="bold" /> Abrir na casa
            </a>
          </Button>
        )}

        {/* <details> nativo em vez de estado: fechado por padrao, o texto do
            canal e' longo o bastante pra empurrar o "Planilhar" pra fora da
            area visivel do painel. */}
        <details className="group mt-6">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] uppercase tracking-wider opacity-40 hover:opacity-70">
            <CaretRight size={12} weight="bold" className="transition-transform group-open:rotate-90" />
            Mensagem do canal
          </summary>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-border p-3 text-[13px] leading-relaxed opacity-80">
            {tip.text}
          </pre>
        </details>
      </div>

      <div className="border-t border-border px-5 py-4">
        {tip.status === "pending" ? (
          <div className="flex gap-2">
            {/* Verde/vermelho porque sao os dois desfechos opostos da tip; o
                azul ficou reservado pro "Abrir na casa", que e' o passo antes
                de decidir. */}
            <Button
              // Verde/vermelho mais escuros que os tokens de texto (--color-positive /
              // --color-negative): aqueles sao feitos pra texto colorido sobre fundo
              // escuro e, virando fundo, deixam o rotulo branco em ~2:1.
              className="h-11 flex-1 border-transparent bg-[#12a05c] text-white hover:bg-[#0e8a4e]"
              onClick={onPlanilhar}
            >
              <Check size={16} weight="bold" /> Planilhar
            </Button>
            <Button
              className="h-11 gap-2 border-transparent bg-[#c0272e] text-white hover:bg-[#a71f26] hover:text-white"
              onClick={onDismiss}
            >
              <XCircle size={16} weight="bold" /> Caiu
            </Button>
          </div>
        ) : tip.status === "caiu" ? (
          <Button variant="outline" className="h-11 w-full gap-2" onClick={onUndismiss}>
            <ArrowCounterClockwise size={16} weight="bold" /> Devolver para a fila
          </Button>
        ) : (
          <p className="text-center text-sm opacity-50">
            Já planilhada — o resultado fica em Apostas.
          </p>
        )}
      </div>
    </aside>
  );
}
