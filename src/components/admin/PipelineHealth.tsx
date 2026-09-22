import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ageLevel,
  ageParts,
  countLevel,
  formatSaoPaulo,
  HEALTH_THRESHOLDS,
  isAlert,
  type HealthLevel,
} from "@/lib/admin-health";
import type { AdminOverview, UndeliveredTip } from "@/api/routes/get-admin";
import { cn } from "@/lib/utils";

const DOT: Record<HealthLevel, string> = {
  ok: "bg-positive",
  warn: "bg-[var(--dashboard-orange)]",
  bad: "bg-negative",
  neutral: "bg-foreground/30",
};

const VALUE: Record<HealthLevel, string> = {
  ok: "text-positive",
  warn: "text-[var(--dashboard-orange)]",
  bad: "text-negative",
  neutral: "text-foreground",
};

interface Card {
  label: string;
  value: string;
  unit?: string;
  hint: string;
  level: HealthLevel;
  /** Só o card de tips sem entrega abre lista — os outros são número puro. */
  details?: UndeliveredTip[];
}

interface Group {
  title: string;
  description: string;
  cards: Card[];
}

export function buildGroups(data: AdminOverview): Group[] {
  const tipLevel = ageLevel(data.lastTipAt, HEALTH_THRESHOLDS.tip);
  const undelivered = data.undeliveredTips.length;

  return [
    {
      title: "Entrada",
      description: "Telegram → tip → fan-out",
      cards: [
        {
          label: "Última tip",
          ...ageParts(data.lastTipAt),
          hint: formatSaoPaulo(data.lastTipAt),
          level: tipLevel,
        },
        {
          label: "Sem entrega (24h)",
          value: String(undelivered),
          unit: undelivered === 1 ? "tip" : "tips",
          // O número que pinta o card é o das que passariam pelo filtro de
          // alguém: as outras são o filtro de % funcionando, não falha.
          hint:
            data.undeliveredExpected > 0
              ? `${data.undeliveredExpected} deveriam ter chegado em alguém`
              : "todas abaixo do filtro de quem recebe",
          level: countLevel(data.undeliveredExpected),
          details: data.undeliveredTips,
        },
        {
          label: "Última entrega",
          ...ageParts(data.lastDeliveryAt),
          hint: formatSaoPaulo(data.lastDeliveryAt),
          // Entrega só faz sentido depois de uma tip: se nenhuma chegou, o
          // silêncio aqui é consequência, não um segundo problema.
          level: tipLevel === "ok" ? ageLevel(data.lastDeliveryAt, HEALTH_THRESHOLDS.tip) : tipLevel,
        },
      ],
    },
    {
      title: "Coleta",
      description: "SofaScore: eventos e resultados",
      cards: [
        {
          label: "Eventos",
          ...ageParts(data.lastEventFetchAt),
          hint: formatSaoPaulo(data.lastEventFetchAt),
          level: ageLevel(data.lastEventFetchAt, HEALTH_THRESHOLDS.collector),
        },
        {
          label: "Resultados",
          ...ageParts(data.lastResultFetchAt),
          hint: formatSaoPaulo(data.lastResultFetchAt),
          level: ageLevel(data.lastResultFetchAt, HEALTH_THRESHOLDS.collector),
        },
        {
          label: "Sem resultado",
          value: String(data.startedEventsWithoutResult),
          unit: data.startedEventsWithoutResult === 1 ? "evento" : "eventos",
          hint: "com aposta, já começaram, nada coletado",
          level: countLevel(data.startedEventsWithoutResult),
        },
      ],
    },
    {
      title: "Liquidação",
      description: "motor de sugestão · suas apostas",
      cards: [
        {
          label: "Sem sugestão",
          value: String(data.pendingBetsWithoutSuggestion),
          unit: data.pendingBetsWithoutSuggestion === 1 ? "aposta" : "apostas",
          hint: "tem placar, motor não opinou",
          level: countLevel(data.pendingBetsWithoutSuggestion),
        },
        {
          label: "Indecisas",
          value: String(data.undecidedSuggestions),
          unit: data.undecidedSuggestions === 1 ? "sugestão" : "sugestões",
          hint: "motor não conseguiu decidir",
          level: countLevel(data.undecidedSuggestions),
        },
        {
          label: "Na sua fila",
          value: String(data.suggestionsAwaitingUser),
          unit: data.suggestionsAwaitingUser === 1 ? "sugestão" : "sugestões",
          hint: "aguardando sua confirmação",
          // Neutro sempre: é trabalho seu pendente, não defeito do sistema.
          level: "neutral",
        },
      ],
    },
  ];
}

export function countAlerts(groups: Group[]): number {
  return groups.reduce((total, g) => total + g.cards.filter((c) => isAlert(c.level)).length, 0);
}

function TipList({ tips }: { tips: UndeliveredTip[] }) {
  if (!tips.length) return null;

  return (
    <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
      {tips.map((tip) => (
        <li key={tip.id} className="flex gap-2 text-xs">
          <span
            className={cn(
              "shrink-0 tabular-nums",
              tip.expectedDelivery ? "text-[var(--dashboard-orange)]" : "opacity-35",
            )}
          >
            {tip.percent === null ? "—" : `${tip.percent}%`}
          </span>
          <span className="truncate opacity-55">{tip.text.replace(/\n/g, " · ")}</span>
          <span className="ml-auto shrink-0 opacity-35">{formatSaoPaulo(tip.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

function HealthCard({ card }: { card: Card }) {
  const [open, setOpen] = useState(false);
  const hasDetails = !!card.details?.length;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOT[card.level])} />
        <span className="text-[11px] uppercase tracking-wider opacity-45 truncate">{card.label}</span>
      </div>

      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className={cn("text-[28px] leading-none font-medium tabular-nums", VALUE[card.level])}>
          {card.value}
        </span>
        {card.unit && <span className="text-sm opacity-45">{card.unit}</span>}
      </div>

      <p className="mt-2 text-xs opacity-45">{card.hint}</p>

      {hasDetails && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs text-accent-text hover:underline"
          >
            {open ? "ocultar" : "ver quais"}
            <CaretDown size={12} className={cn("transition-transform", open && "rotate-180")} />
          </button>
          {open && <TipList tips={card.details!} />}
        </>
      )}
    </div>
  );
}

function GroupCards({ cards }: { cards: Card[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <HealthCard key={card.label} card={card} />
      ))}
    </div>
  );
}

/** Mobile: um grupo por vez, e já abre no que está pior. */
function MobileGroups({ groups }: { groups: Group[] }) {
  const worst = groups.find((g) => g.cards.some((c) => c.level === "bad")) ?? groups.find((g) => countAlerts([g]) > 0);
  const [openTitle, setOpenTitle] = useState<string | null>(worst?.title ?? null);

  return (
    <div className="space-y-2 sm:hidden">
      {groups.map((group) => {
        const alerts = countAlerts([group]);
        const open = openTitle === group.title;
        const level: HealthLevel = group.cards.some((c) => c.level === "bad")
          ? "bad"
          : alerts > 0
            ? "warn"
            : "ok";

        return (
          <div key={group.title} className="rounded-lg border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenTitle(open ? null : group.title)}
              className="flex w-full items-center gap-2 p-3.5 text-left"
            >
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOT[level])} />
              <span className="text-sm font-medium">{group.title}</span>
              <span className={cn("ml-auto text-xs", alerts > 0 ? VALUE[level] : "opacity-40")}>
                {alerts > 0 ? `${alerts} ${alerts === 1 ? "alerta" : "alertas"}` : "ok"}
              </span>
              <CaretDown size={14} className={cn("opacity-40 transition-transform", open && "rotate-180")} />
            </button>
            {open && (
              <div className="p-3 pt-0">
                <GroupCards cards={group.cards} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface PipelineHealthProps {
  data?: AdminOverview;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function PipelineHealth({ data, isPending, isError, onRetry }: PipelineHealthProps) {
  if (isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          // Mesma altura do card montado: sem isso a tela pula quando os dados
          // chegam.
          <Skeleton key={i} className="h-[120px] rounded-lg" />
        ))}
      </div>
    );
  }

  // Erro isolado: a lista de usuários é outra chamada e continua na tela.
  if (isError || !data) {
    return (
      <EmptyState
        title="Não foi possível ler o pipeline"
        description="A lista de usuários abaixo continua valendo."
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar de novo
          </Button>
        }
      />
    );
  }

  const groups = buildGroups(data);

  return (
    <>
      <MobileGroups groups={groups} />

      <div className="hidden sm:block">
        {groups.map((group) => (
          <div
            key={group.title}
            className="grid grid-cols-[150px_1fr] gap-4 border-t border-border py-4 first:border-t-0 first:pt-0"
          >
            <div className="pt-1">
              <h3 className="text-sm font-medium">{group.title}</h3>
              <p className="text-xs opacity-40 mt-0.5">{group.description}</p>
            </div>
            <GroupCards cards={group.cards} />
          </div>
        ))}
      </div>
    </>
  );
}
