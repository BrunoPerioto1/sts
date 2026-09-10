import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTime } from "@/lib/format";
import type { TipItem, TipStatus } from "@/api/routes/get-tips";

// Uma definição de colunas só, usada pelo cabeçalho e pelas linhas — mesmo
// arranjo de BetRowDesktop, que é a outra lista densa do app.
export const TIP_GRID =
  "grid items-center gap-3 grid-cols-[46px_minmax(0,1fr)_92px_56px_76px_64px_92px]";

const statusMeta: Record<TipStatus, { label: string; variant: "pending" | "won" | "canceled" }> = {
  pending: { label: "Pendente", variant: "pending" },
  planilhada: { label: "Planilhada", variant: "won" },
  caiu: { label: "Caiu", variant: "canceled" },
};

export function TipColumnHeaderDesktop() {
  return (
    <div className={cn(TIP_GRID, "px-3 pb-1.5 text-[11px] uppercase tracking-wider opacity-40")}>
      <span>Hora</span>
      <span>Evento</span>
      <span>Casa</span>
      <span className="text-right">Odd</span>
      <span className="text-right">Stake</span>
      <span className="text-right">%</span>
      <span>Status</span>
    </div>
  );
}

export function TipRowDesktop({
  tip,
  selected,
  onSelect,
}: {
  tip: TipItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const status = statusMeta[tip.status];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={cn(
        TIP_GRID,
        "w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.03]",
        // Barra à esquerda em vez de fundo forte: a linha selecionada precisa
        // se distinguir do hover sem virar o elemento mais claro da tela.
        selected && "bg-foreground/[0.05] shadow-[inset_2px_0_0_0_var(--color-accent)]",
      )}
    >
      <span className="text-xs tabular-nums opacity-50">{formatTime(tip.createdAt)}</span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {tip.game ?? "Jogo não identificado"}
        </span>
        {tip.market && (
          <span className="mt-0.5 block truncate text-xs opacity-50">{tip.market}</span>
        )}
      </span>

      <span className="truncate text-sm opacity-70">{tip.house ?? "—"}</span>

      <span className="text-right text-sm font-medium tabular-nums">
        {tip.odd?.toFixed(2) ?? "—"}
      </span>

      <span className="text-right text-sm tabular-nums opacity-70">
        {tip.recommendedStake !== null ? formatCurrency(tip.recommendedStake) : "—"}
      </span>

      <span className="text-right text-xs font-medium tabular-nums text-positive">
        {tip.percent !== null ? `${tip.percent.toFixed(2).replace(".", ",")}%` : "—"}
      </span>

      <span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </span>
    </button>
  );
}
