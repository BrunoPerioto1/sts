import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CaretDown } from "@phosphor-icons/react";
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
import type { AdminOverview } from "@/api/routes/get-admin";
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
  /** Link pra tela de detalhe, quando o número sozinho não explica o caso. */
  detailsTo?: string;
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
          detailsTo: undelivered > 0 ? "/admin/tips" : undefined,
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

function HealthCard({ card }: { card: Card }) {
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

      {card.detailsTo && (
        <Link to={card.detailsTo} className="mt-2 inline-flex items-center gap-1 text-xs text-accent-text hover:underline">
          ver quais
          <ArrowRight size={12} />
        </Link>
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

function groupLevel(group: Group): HealthLevel {
  if (group.cards.some((c) => c.level === "bad")) return "bad";
  return countAlerts([group]) > 0 ? "warn" : "ok";
}

const RING: Record<HealthLevel, string> = {
  ok: "shadow-[0_0_0_3px_rgb(var(--rgb-positive)/0.14)]",
  warn: "shadow-[0_0_0_3px_color-mix(in_srgb,var(--dashboard-orange)_16%,transparent)]",
  bad: "shadow-[0_0_0_3px_rgb(var(--rgb-negative)/0.16)]",
  neutral: "",
};

const alertsLabel = (n: number) => `${n} ${n === 1 ? "alerta" : "alertas"}`;

/** Mobile: título que já diz onde está o problema — "2 alertas na coleta". */
export function PipelineSummary({ data }: { data: AdminOverview }) {
  const groups = buildGroups(data);
  const total = countAlerts(groups);
  const withAlerts = groups.filter((g) => countAlerts([g]) > 0);
  const fine = groups.filter((g) => countAlerts([g]) === 0).map((g) => g.title);
  const level: HealthLevel = groups.some((g) => groupLevel(g) === "bad") ? "bad" : total > 0 ? "warn" : "ok";

  const title =
    total === 0
      ? "Tudo rodando"
      : withAlerts.length === 1
        ? `${alertsLabel(total)} na ${withAlerts[0].title.toLowerCase()}`
        : alertsLabel(total);
  const sub =
    total === 0
      ? "Entrada, coleta e liquidação estão normais."
      : fine.length === 0
        ? "Nenhuma etapa está normal."
        : `${fine.join(" e ")} ${fine.length === 1 ? "está normal" : "estão normais"}.`;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full shrink-0", DOT[level])} />
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="text-[12.5px] text-zinc-500">{sub.charAt(0) + sub.slice(1).toLowerCase()}</p>
    </div>
  );
}

/** Mobile: as etapas viram uma linha do tempo, e já abre na que está pior. */
function MobileTimeline({ groups }: { groups: Group[] }) {
  const worst = groups.find((g) => groupLevel(g) === "bad") ?? groups.find((g) => countAlerts([g]) > 0);
  const [openTitle, setOpenTitle] = useState<string | null>(worst?.title ?? null);

  return (
    <div className="sm:hidden">
      {groups.map((group, i) => {
        const alerts = group.cards.filter((c) => isAlert(c.level));
        const metrics = group.cards.filter((c) => !isAlert(c.level));
        const level = groupLevel(group);
        const open = openTitle === group.title;

        return (
          <div key={group.title} className="flex gap-3">
            <div className="w-3.5 shrink-0 flex flex-col items-center">
              <span className={cn("mt-1.5 w-2.5 h-2.5 rounded-full shrink-0", DOT[level], RING[level])} />
              {i < groups.length - 1 && <span className="flex-1 w-px mt-1.5 bg-border" />}
            </div>
            <div className="flex-1 min-w-0 pb-3">
              <button
                type="button"
                onClick={() => setOpenTitle(open ? null : group.title)}
                className="w-full flex items-center gap-2 pt-0.5 pb-2 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[15px]">{group.title}</p>
                  <p className="text-[11.5px] text-zinc-500">{group.description}</p>
                </div>
                <span className={cn("text-xs", alerts.length ? VALUE[level] : "text-zinc-500")}>
                  {alerts.length ? alertsLabel(alerts.length) : "ok"}
                </span>
                <CaretDown size={13} className={cn("text-zinc-500 transition-transform", open && "rotate-180")} />
              </button>

              {open && (
                <div className="space-y-2">
                  {alerts.map((card) => (
                    <div
                      key={card.label}
                      className={cn(
                        "px-3 py-[11px] rounded-[11px] border space-y-0.5",
                        card.level === "bad"
                          ? "border-negative/25 bg-negative/[0.07]"
                          : "border-[var(--dashboard-orange)]/25 bg-[var(--dashboard-orange)]/[0.07]",
                      )}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="flex-1 text-[13.5px]">{card.label}</span>
                        <span className={cn("text-[15px] tabular-nums", VALUE[card.level])}>
                          {card.value} <span className="text-xs opacity-70">{card.unit}</span>
                        </span>
                      </div>
                      <p className="text-[11.5px] leading-snug text-zinc-400">{card.hint}</p>
                      {card.detailsTo && (
                        <Link to={card.detailsTo} className="inline-flex items-center gap-1 pt-0.5 text-xs text-accent-text">
                          ver quais <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  ))}
                  {metrics.length > 0 && (
                    <div className="rounded-[11px] border border-border bg-card divide-y divide-border">
                      {metrics.map((card) => (
                        <div key={card.label} className="px-3 py-2.5 flex items-center gap-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px]">{card.label}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{card.hint}</p>
                          </div>
                          {/* Zero discreto: "0 tips" em verde grande chamava mais
                              atenção que o alerta de verdade. */}
                          <span
                            className={cn(
                              "shrink-0 text-[15px] tabular-nums",
                              card.value === "0" ? "text-zinc-500" : "text-foreground",
                            )}
                          >
                            {card.value} {card.unit && <span className="text-xs text-zinc-500">{card.unit}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
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
      <MobileTimeline groups={groups} />

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
