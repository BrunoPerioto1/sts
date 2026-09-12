import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTime, kickoffParts } from "@/lib/format";
import type { TipItem, TipStatus } from "@/api/routes/get-tips";

// Uma definição de colunas só, usada pelo cabeçalho e pelas linhas — mesmo
// arranjo de BetRowDesktop, que é a outra lista densa do app.
// gap-4 e não gap-3: com oito colunas, 12px de respiro entre elas fazia a
// linha ler como um bloco só. As larguras saem do conteúdo mais largo que cada
// uma precisa mostrar inteiro — "R$ 1.000,00" na stake, o badge "Planilhada"
// no status. Início e casa são estreitos porque quebram em duas linhas.
export const TIP_GRID =
  "grid items-center gap-4 grid-cols-[52px_72px_minmax(0,1fr)_108px_56px_88px_52px_96px]";

const statusMeta: Record<TipStatus, { label: string; variant: "pending" | "won" | "canceled" }> = {
  pending: { label: "Pendente", variant: "pending" },
  planilhada: { label: "Planilhada", variant: "won" },
  caiu: { label: "Caiu", variant: "canceled" },
};

export function TipColumnHeaderDesktop() {
  return (
    <div
      className={cn(
        TIP_GRID,
        // opacity-40 sumia contra o fundo escuro; o cabeçalho precisa ser
        // legível pra coluna ter nome, não só posição.
        "px-3 pb-2 text-[11px] uppercase tracking-wider opacity-60",
      )}
    >
      {/* Com duas colunas de horário, "Hora" sozinho não dizia de qual:
          esta é quando a tip chegou, a outra é quando o jogo começa. */}
      <span>Chegou</span>
      <span>Início</span>
      <span>Evento</span>
      <span>Casa</span>
      <span className="text-right">Odd</span>
      <span className="text-right">Stake</span>
      <span className="text-right">%</span>
      <span>Status</span>
    </div>
  );
}

function kickoff(value: string | null) {
  if (!value) return <span className="text-xs opacity-30">—</span>;
  const { dia, hora, eHoje } = kickoffParts(value);
  return (
    <>
      {/* Hoje em destaque: é a única linha em que "dá tempo de entrar?" tem
          resposta na hora, e é o que se procura varrendo a coluna. */}
      <span
        className={cn(
          "block truncate text-[11px] leading-tight",
          eHoje ? "font-medium opacity-70" : "opacity-45",
        )}
      >
        {dia}
      </span>
      <span className="block text-xs leading-tight tabular-nums opacity-90">{hora}</span>
    </>
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
        "w-full rounded-md px-3 py-3 text-left transition-colors hover:bg-foreground/[0.03]",
        // Barra à esquerda em vez de fundo forte: a linha selecionada precisa
        // se distinguir do hover sem virar o elemento mais claro da tela.
        selected && "bg-foreground/[0.05] shadow-[inset_2px_0_0_0_var(--color-accent)]",
      )}
    >
      <span className="text-xs tabular-nums opacity-50">{formatTime(tip.createdAt)}</span>

      {/* Dia em cima, hora embaixo. A linha já tem duas alturas por causa do
          mercado no Evento, então empilhar aqui não custa altura nenhuma — e
          resolve o corte de "Amanhã 11:30" numa coluna estreita. */}
      <span className="min-w-0">{kickoff(tip.eventStartAt)}</span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {tip.game ?? "Jogo não identificado"}
        </span>
        {tip.market && (
          <span className="mt-0.5 block truncate text-xs opacity-50">{tip.market}</span>
        )}
      </span>

      {/* Quebra em duas linhas em vez de cortar: "Esportes da Sorte" nao cabe
          numa linha sem uma coluna larga demais, e a linha ja tem duas alturas
          por causa do mercado. Ver a casa inteira importa mais que o alinhamento. */}
      <span className="line-clamp-2 text-sm leading-tight opacity-70">{tip.house ?? "—"}</span>

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
