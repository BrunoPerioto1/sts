import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatMoney, formatTime, kickoffParts, formatOdd, formatPercent, houseDisplayName } from "@/lib/format";
import { TIP_TIMING_TONE_CLASS, tipTiming, type TipTimingTone } from "@/lib/tip-schedule";
import { TipKickoffBadge } from "./TipKickoffBadge";
import type { TipItem, TipStatus } from "@/api/routes/get-tips";

// Uma definição de colunas só, usada pelo cabeçalho e pelas linhas — mesmo
// arranjo de BetRowDesktop, que é a outra lista densa do app.
// gap-4 e não gap-3: com sete colunas, 12px de respiro entre elas fazia a
// linha ler como um bloco só. As larguras saem do conteúdo mais largo que cada
// uma precisa mostrar inteiro — "Começou há mais de um dia" no tempo,
// "R$ 1.000,00" na stake, o badge "Planilhada" no status. A casa é estreita
// porque quebra em duas linhas.
export const TIP_GRID =
  "grid items-center gap-4 grid-cols-[212px_minmax(0,1fr)_108px_56px_88px_52px_96px]";

const statusMeta: Record<TipStatus, { label: string; variant: "pending" | "won" | "canceled" }> = {
  pending: { label: "Pendente", variant: "pending" },
  planilhada: { label: "Planilhada", variant: "won" },
  caiu: { label: "Caiu", variant: "canceled" },
};

export function TipColumnHeaderDesktop({
  selectAll,
  selectionMode,
}: {
  /** Checkbox de "selecionar todas" na coluna de seleção (no lugar da linha à parte). */
  selectAll?: { checked: boolean | "indeterminate"; onToggle: () => void; count: number };
  /** Fora do modo de seleção a coluna fica reservada, mas vazia (igual Apostas). */
  selectionMode?: boolean;
}) {
  return (
    <div className="flex items-center border-b border-border py-2.5">
      {selectAll && (
        <div className={cn("flex w-10 shrink-0 justify-center transition-opacity", !selectionMode && "pointer-events-none opacity-0")}>
          <Checkbox
            tabIndex={selectionMode ? 0 : -1}
            checked={selectAll.checked}
            onCheckedChange={selectAll.onToggle}
            aria-label={`Selecionar todas (${selectAll.count})`}
            title={`Selecionar todas (${selectAll.count}) · Shift + clique seleciona um intervalo`}
          />
        </div>
      )}
    <div
      className={cn(
        TIP_GRID,
        // opacity-40 sumia contra o fundo escuro; o cabeçalho precisa ser
        // legível pra coluna ter nome, não só posição.
        "flex-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted",
      )}
    >
      {/* Os três tempos (quanto falta, jogo, recebida) numa coluna, com rótulo. */}
      <span>Tempo</span>
      <span>Evento</span>
      <span>Casa</span>
      <span className="text-right">Odd</span>
      <span className="text-right">Stake</span>
      <span className="text-right">%</span>
      <span>Status</span>
    </div>
    </div>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * "18:30" (hoje implícito), "ontem 18:30", "amanhã 18:30", "28/09 18:30".
 * Ontem é o caso comum no bloco dos iniciados, e a data inteira ali é o que
 * cortava a linha.
 */
function jogoParts(eventStartAt: string) {
  const { dia, hora, eHoje } = kickoffParts(eventStartAt);
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const eOntem = new Date(eventStartAt).toDateString() === ontem.toDateString();
  const prefixo = eHoje ? "" : eOntem ? "ontem " : `${dia.toLowerCase()} `;
  return { prefixo, hora };
}

// Uma coluna só pros três tempos. Em destaque, num chip, o horário do
// jogo — é o que se procura ao bater o olho na fila; ao lado, na cor de
// urgência, o relativo que responde "ainda dá tempo?"; embaixo quando a tip foi
// recebida. Número solto ("há 5h29") não dizia de qual dos três tempos era.
function TipTimeCell({ tip }: { tip: TipItem }) {
  // "Recebida" (do canal), não "planilhada": é o createdAt da tip, e o mesmo
  // termo vale no card do mobile. Maiúscula nos dois lados do "·", como rótulos.
  const recebida = `Recebida ${formatTime(tip.createdAt)}`;
  const jogo = tip.eventStartAt ? jogoParts(tip.eventStartAt) : null;

  // Fora da fila pendente o relativo não ajuda (o jogo já foi): sai da linha
  // de baixo e fica só a hora recebida.
  const timing: { headline: string; tone: TipTimingTone } | null =
    tip.status === "pending" && jogo ? tipTiming(tip.eventStartAt) : null;

  const jogoTexto = jogo ? `Jogo ${jogo.prefixo}${jogo.hora}` : "Sem horário identificado";
  const title = [jogoTexto, timing?.headline, recebida].filter(Boolean).join(" · ");

  return (
    <span className="min-w-0" title={title}>
      {jogo ? (
        <span className="flex min-w-0 items-center gap-1.5 leading-tight">
          <TipKickoffBadge label={capitalize(`${jogo.prefixo}${jogo.hora}`)} />
          {timing && (
            <span className={cn("min-w-0 truncate text-[12px] font-medium", timing.tone === "upcoming" ? "text-zinc-400" : TIP_TIMING_TONE_CLASS[timing.tone])}>
              {timing.headline}
            </span>
          )}
        </span>
      ) : (
        <span className="block truncate text-[13px] font-medium leading-tight text-zinc-500">
          Sem horário identificado
        </span>
      )}
      <span className="mt-1 block truncate text-[11px] leading-tight tabular-nums text-zinc-500">
        {recebida}
      </span>
    </span>
  );
}

export function TipRowDesktop({
  tip,
  selected,
  onSelect,
  checked,
  onToggle,
  selectionMode,
}: {
  tip: TipItem;
  selected: boolean;
  onSelect: () => void;
  checked?: boolean;
  onToggle?: (shiftKey: boolean) => void;
  /** Alguma tip marcada: clique na linha marca/desmarca em vez de abrir o painel. */
  selectionMode?: boolean;
}) {
  const status = statusMeta[tip.status];

  return (
    // Marcada pra lote: mesmo padrão das linhas de Apostas — fundo azul leve
    // cobrindo a linha inteira (checkbox incluso), sem contorno nem barra, e o
    // checkbox como indicador principal. Seleção clara, não dominante.
    <div
      className={cn(
        "group flex items-center rounded-md transition-colors duration-150",
        checked
          ? "bg-accent/[0.1] hover:bg-accent/[0.14]"
          : "hover:bg-foreground/[0.025]",
      )}
    >
      {onToggle && (
        // Igual Apostas: o checkbox só aparece no hover da linha ou com o modo
        // de seleção ativo — fixo em toda linha era ruído na fila.
        <div className={cn("flex w-10 shrink-0 justify-center transition-opacity", selectionMode || checked ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")}>
          <Checkbox checked={checked} onClick={(event) => onToggle(event.shiftKey)}
            onMouseDown={(event) => { if (event.shiftKey) event.preventDefault(); }}
            aria-label={`Selecionar ${tip.game ?? "tip"} (${tip.id})`}
            className="transition-colors duration-150 group-hover:border-foreground/45 data-[state=checked]:bg-[color-mix(in_srgb,var(--color-success)_62%,var(--color-bg))]" />
        </div>
      )}
      <button
      type="button"
      onClick={(event) => {
        if (event.shiftKey && onToggle) onToggle(true);
        else if (selectionMode && onToggle) onToggle(false);
        else onSelect();
      }}
      onMouseDown={(event) => { if (event.shiftKey) event.preventDefault(); }}
      aria-current={selected}
      className={cn(
        TIP_GRID,
        // O hover mora no container (linha inteira, checkbox incluso); aqui
        // só o foco de teclado, sem o contorno do clique.
        "min-w-0 flex-1 rounded-md px-3 py-2.5 text-left outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-foreground/25",
        // Linha aberta no painel: barra fina à esquerda, a mesma marcada ou não
        // — antes somava um fundo e um contorno por cima do da seleção.
        selected && "shadow-[inset_2px_0_0_0_var(--color-accent)]",
        selected && !checked && "bg-foreground/[0.04]",
      )}
    >
      <TipTimeCell tip={tip} />

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
      <span className="line-clamp-2 text-sm leading-tight opacity-70">{tip.house ? houseDisplayName(tip.house) : "—"}</span>

      <span className="text-right text-sm font-medium tabular-nums">
        {tip.odd != null ? formatOdd(tip.odd) : "—"}
      </span>

      <span className="text-right text-sm tabular-nums opacity-70">
        {tip.recommendedStake !== null ? formatMoney(tip.recommendedStake) : "—"}
      </span>

      <span className="text-right text-xs font-medium tabular-nums text-zinc-400">
        {tip.percent !== null ? formatPercent(tip.percent / 100, { decimals: 2 }) : "—"}
      </span>

      <span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </span>
    </button>
    </div>
  );
}
