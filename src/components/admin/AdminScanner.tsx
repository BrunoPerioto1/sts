import { useState } from "react";
import {
  CaretDown,
  Check,
  CheckCircle,
  Database,
  Info,
  MagnifyingGlass,
  Plus,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AdminPanel,
  COLUMN_HEAD,
  FilterChip,
} from "@/components/admin/AdminPanel";
import {
  useAdminScanner,
  useAdminScannerSample,
  useCreateAdminScanner,
  useDeleteAdminScanner,
  useUpdateAdminScanner,
  type ScannerTarget,
} from "@/hooks/queries/use-admin";
import { useSports } from "@/hooks/queries/use-sports";
import { SportIcon } from "@/components/apostas/SportIcon";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { OptionRow } from "@/components/apostas/OptionRow";
import { useIsMobile } from "@/hooks/use-mobile";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { ageParts, formatSaoPaulo } from "@/lib/admin-health";
import {
  collectLabel,
  collectSummary,
  hasProblem,
  nameFromUrl,
  parseTournamentId,
  sportFromUrl,
} from "@/lib/scanner";
import {
  groupLabel,
  incidentLabel,
  playerLabel,
  statLabel,
} from "@/lib/scanner-labels";
import type { ScannerFlag, ScannerTournament } from "@/api/routes/get-admin";
import { cn } from "@/lib/utils";
import { formatInt } from "@/lib/format";

const FLAGS: { key: ScannerFlag; label: string; short: string; hint: string }[] =
  [
    {
      key: "isActive",
      label: "Coleta",
      short: "Coleta",
      hint: "Busca os próximos jogos (é o que casa a aposta com o jogo)",
    },
    {
      key: "statistics",
      label: "Estatísticas",
      short: "Estatíst.",
      hint: "Depois do jogo: escanteios, chutes, cartões, faltas",
    },
    {
      key: "incidents",
      label: "Lances",
      short: "Lances",
      hint: "Depois do jogo: ordem dos gols, pênaltis, vermelhos",
    },
    {
      key: "lineups",
      label: "Jogadores",
      short: "Jogad.",
      hint: "Depois do jogo: gols, assistências, chutes por jogador",
    },
  ];

const LEGEND = [
  [
    "Próximos 30 dias",
    "Jogos encontrados na janela da coleta, ou o problema da última tentativa.",
  ],
  ["Coleta", "Busca jogos e placar. Desmarcar pausa a competição sem apagar nada."],
  ["Estatísticas", "Números do jogo: chutes, escanteios, cartões, faltas."],
  ["Lances", "Eventos do jogo: gols, cartões, substituições."],
  ["Jogadores", "Escalação e métricas por jogador."],
] as const;

// O results.py só busca dado extra de jogo de futebol com placar fechado: nos
// outros esportes essas três colunas não mudam nada, então nem aparecem.
const FACTS_SPORT = "Futebol";

const GRID =
  "sm:grid sm:items-center sm:gap-x-2 sm:grid-cols-[minmax(0,1fr)_210px_repeat(4,84px)_72px]";

const ICON_BUTTON =
  "w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/[0.07] transition";

const ORANGE = "text-[var(--dashboard-orange)]";
const ORANGE_BG =
  "bg-[color-mix(in_srgb,var(--dashboard-orange)_12%,transparent)]";

const FAILURE: Record<string, string> = {
  blocked: "bloqueio do SofaScore ou do proxy",
  error: "erro na coleta (ver log do Actions)",
};

const GAP_LABEL = {
  statistics: "Estatísticas do jogo",
  lineups: "Jogadores",
} as const;

/**
 * Selo da linha: no futebol, seção da amostra que veio inteira vazia. É o que
 * diz "a conferência automática não vai liquidar estes mercados nesta liga".
 * Fora do futebol nada é liquidado por estatística, então não há o que avisar.
 */
function coverageWarning(t: ScannerTournament): string | null {
  if (t.sportName !== FACTS_SPORT || !t.coverageGaps.length) return null;
  return `Sem cobertura no SofaScore: ${t.coverageGaps.map((g) => GAP_LABEL[g]).join(" e ")}. A conferência automática não liquida esses mercados nesta liga (amostra de um jogo; veja em Cobertura de dados).`;
}

// Filtro de estado, combinado com o de esporte e com a busca.
const STATUS_FILTERS = [
  { id: "active", label: "Ativas", test: (t: ScannerTournament) => t.isActive },
  {
    id: "paused",
    label: "Pausadas",
    test: (t: ScannerTournament) => !t.isActive,
  },
  {
    id: "empty",
    label: "Sem jogos",
    test: (t: ScannerTournament) =>
      t.isActive && t.lastCheckStatus === "ok" && t.lastEvents === 0,
  },
  {
    id: "problem",
    label: "Problemas",
    test: (t: ScannerTournament) => hasProblem(t),
  },
  {
    id: "coverage",
    label: "Sem cobertura",
    test: (t: ScannerTournament) => coverageWarning(t) !== null,
  },
] as const;
type StatusId = (typeof STATUS_FILTERS)[number]["id"];

function collectTitle(t: ScannerTournament): string | undefined {
  if (!t.isActive) return "Coleta desligada. Marque Coleta pra voltar a buscar.";
  if (t.lastCheckStatus === "invalid_id")
    return "O SofaScore não achou esse id. Confira o número no fim da URL do torneio.";
  if (t.lastCheckStatus === "blocked" || t.lastCheckStatus === "error") {
    return `Última tentativa ${formatSaoPaulo(t.lastCheckAt)}: ${FAILURE[t.lastCheckStatus]}. Última coleta válida: ${formatSaoPaulo(t.lastEventsAt)}.`;
  }
  if (t.lastCheckStatus === "ok" && t.lastEvents === 0) {
    return `Nenhum jogo nos próximos 30 dias: fora de temporada ou pausa no calendário. Coletado ${formatSaoPaulo(t.lastCheckAt)}.`;
  }
  if (t.lastCheckAt) return `Coletado ${formatSaoPaulo(t.lastCheckAt)}`;
  return "Competição nova. Entra na próxima coleta.";
}

const gamesText = (rows: ScannerTournament[]) =>
  `${formatInt(collectSummary(rows).games)} jogos`;

function useSetFlag() {
  const update = useUpdateAdminScanner();
  return (
    target: ScannerTarget,
    key: ScannerFlag,
    value: boolean,
    success?: string,
  ) =>
    update.mutate(
      { target, flags: { [key]: value } },
      {
        onSuccess: () => success && actionToast.success({ title: success }),
        onError: (err) =>
          actionToast.error({
            description: getErrorMessage(
              err,
              "Não foi possível salvar. A tela voltou ao estado anterior.",
            ),
          }),
      },
    );
}

function FlagBox({
  checked,
  label,
  title,
  dim,
  onChange,
}: {
  checked: boolean | "indeterminate";
  label: string;
  title: string;
  dim?: boolean;
  onChange: () => void;
}) {
  // No celular as colunas somem: o rótulo vai do lado do checkbox.
  return (
    <label
      className={cn(
        "flex items-center gap-2 h-11 sm:h-8 text-[12.5px] cursor-pointer sm:justify-center",
        dim && "opacity-40",
      )}
      title={title}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        aria-label={title}
      />
      <span className="sm:hidden whitespace-nowrap">{label}</span>
    </label>
  );
}

const onlyScore = (
  <span className="col-span-3 self-center text-xs opacity-40 sm:text-center">
    só placar
  </span>
);

function SportHeader({
  sport,
  rows,
  collapsed,
  onToggle,
}: {
  sport: string;
  rows: ScannerTournament[];
  collapsed: boolean;
  onToggle: () => void;
}) {
  const setFlag = useSetFlag();
  const flags = sport === FACTS_SPORT ? FLAGS : FLAGS.slice(0, 1);
  const target = { sportId: rows[0].sportId };
  const scope = `${rows.length} ${rows.length === 1 ? "competição" : "competições"} de ${sport}`;

  return (
    <div
      className={cn(
        GRID,
        // Separador de categoria: fundo mais forte e faixa de destaque à
        // esquerda, pra não se confundir com uma linha.
        "flex items-center px-4 sm:px-6 h-12 sm:h-11 border-y border-border shadow-[inset_2px_0_0_var(--accent)] bg-foreground/[0.06]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex flex-1 sm:flex-none items-center gap-2 h-8 min-w-0 text-left justify-self-start"
      >
        <CaretDown
          size={12}
          className={cn(
            "hidden sm:block shrink-0 opacity-50 transition-transform",
            collapsed && "-rotate-90",
          )}
        />
        <SportIcon name={sport} size={16} className="shrink-0 opacity-60" />
        <span className="text-sm font-semibold truncate">{sport}</span>
        <span className="text-[11.5px] tabular-nums min-w-[22px] h-5 px-1.5 rounded-md bg-foreground/[0.07] opacity-70 flex items-center justify-center">
          {rows.length}
        </span>
        <span className="sm:hidden ml-auto text-xs tabular-nums opacity-45">
          {gamesText(rows)}
        </span>
        <CaretDown
          size={13}
          className={cn(
            "sm:hidden shrink-0 opacity-50 transition-transform",
            collapsed && "-rotate-90",
          )}
        />
      </button>
      <span className="hidden sm:block text-[12.5px] tabular-nums opacity-45">
        {gamesText(rows)}
      </span>
      {/* No celular a ação em lote some: o cabeçalho só recolhe. */}
      <div className="hidden sm:contents">
        {flags.map((f) => {
          const on = rows.filter((r) => r[f.key]).length;
          const all = on === rows.length;
          // Ação sobre o que existe hoje: competição cadastrada depois entra com tudo ligado.
          const title = `${all ? "Desativar" : "Ativar"} ${f.label} nas ${scope}`;
          return (
            <FlagBox
              key={f.key}
              checked={all ? true : on === 0 ? false : "indeterminate"}
              label={f.short}
              title={title}
              onChange={() =>
                setFlag(
                  target,
                  f.key,
                  !all,
                  `${f.label} ${all ? "desligado" : "ligado"} nas ${scope}`,
                )
              }
            />
          );
        })}
        {sport !== FACTS_SPORT && onlyScore}
      </div>
      <span className="hidden sm:block" />
    </div>
  );
}

function Chip({
  used,
  missing,
  dim,
  title,
  children,
}: {
  used?: boolean;
  missing?: boolean;
  dim?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center h-8 sm:h-[26px] px-2.5 rounded-md border text-[13px] sm:text-[12.5px] whitespace-nowrap",
        missing
          ? "border-dashed border-foreground/25 text-foreground/45"
          : used
            ? "border-accent/55 bg-accent/15 text-foreground"
            : "border-border text-foreground/60",
        dim && "opacity-45",
      )}
    >
      {children}
    </span>
  );
}

function Note({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "info";
  children: React.ReactNode;
}) {
  const Icon = tone === "ok" ? CheckCircle : tone === "warn" ? Warning : Info;
  return (
    <span
      className={cn(
        "flex gap-1.5 text-[12.5px] leading-snug",
        tone === "ok" && "text-success",
        tone === "warn" && ORANGE,
        tone === "info" && "text-foreground/55",
      )}
    >
      <Icon size={14} className="shrink-0 mt-px" />
      <span>{children}</span>
    </span>
  );
}

/** "Dá pra liquidar?": o que o motor precisa e esta liga não entregou. */
// Amostra é um jogo só, e o SofaScore omite estatística zerada: chave ausente
// numa seção que veio pode ser zero naquele jogo, não falta de cobertura. Só a
// seção inteira vazia é falta certa.
function Diagnosis({
  on,
  missing,
  available,
  label,
}: {
  on: boolean;
  missing?: string[];
  available: number;
  label: (key: string) => string;
}) {
  if (!on)
    return (
      <Note tone="warn">
        scanner desligado: a conferência não recebe estes dados
      </Note>
    );
  if (!missing) return null;
  if (available === 0)
    return (
      <Note tone="warn">
        sem cobertura: a conferência não liquida estes mercados nesta liga
      </Note>
    );
  if (missing.length === 0)
    return <Note tone="ok">tudo que a conferência precisa</Note>;
  return (
    <Note tone="info">
      não vieram neste jogo (pode ter sido zero): {missing.map(label).join(", ")}
    </Note>
  );
}

// Lances que o motor lê: gols (ordem, primeiro/último), pênaltis e cartões
// (vermelho no jogo, pontos de cartão do time e do jogador).
const USED_INCIDENTS = new Set([
  "goal/regular",
  "goal/penalty",
  "goal/ownGoal",
  "inGamePenalty",
  "card/yellow",
  "card/red",
  "card/yellowRed",
]);

type CoverageItem = { key: string; label: string; used: boolean; title?: string };
type CoverageSection = {
  title: string;
  unit: string;
  extra?: string | false | null;
  on: boolean;
  items: CoverageItem[];
  missing?: string[];
  available: number;
  missingLabel: (key: string) => string;
};

/**
 * Cobertura de dados: o que o SofaScore entrega pra competição (amostra.py,
 * um jogo encerrado), o que o scanner busca (flags da linha) e o que a
 * conferência automática usa. Três coisas diferentes, separadas na tela.
 */
function CoveragePanel({ t }: { t: ScannerTournament }) {
  const { data, isPending, isError } = useAdminScannerSample(t.id, true);
  const [mode, setMode] = useState<"used" | "all" | null>(null);
  const box = (children: React.ReactNode) => (
    <div className="px-4 py-4 sm:pl-[52px] sm:pr-6 border-b border-border shadow-[inset_2px_0_0_color-mix(in_srgb,var(--accent)_45%,transparent)] bg-foreground/[0.03] space-y-3.5 text-sm">
      {children}
    </div>
  );
  if (isPending)
    return box(
      [0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-12 rounded-lg" delay={i * 60} />
      )),
    );
  if (isError)
    return box(
      <p className="opacity-60">Não foi possível carregar a cobertura.</p>,
    );
  const s = data.sample;
  if (!s)
    return box(
      <p className="opacity-60">
        Sem amostra ainda: rode jobs/sofascore/amostra.py.
      </p>,
    );
  if (!s.event)
    return box(
      <p className="opacity-60">
        Nenhum jogo encerrado nas duas últimas temporadas.
      </p>,
    );

  const football = t.sportName === FACTS_SPORT;
  const { home, away } = s.event;
  const players = s.lineups?.keys ?? [];
  const all: CoverageSection[] = [
    {
      title: "Estatísticas do jogo",
      unit: "estatísticas",
      on: t.statistics,
      items: (s.statistics ?? []).map((i) => ({
        key: i.key,
        label: statLabel(i.key, i.name),
        used: i.used,
        title: `${home}: ${String(i.home)} · ${away}: ${String(i.away)} (${groupLabel(i.group)})`,
      })),
      missing: s.missing?.statistics,
      available: s.statistics?.length ?? 0,
      missingLabel: (k) => statLabel(k, k),
    },
    {
      title: "Lances",
      unit: "tipos",
      on: t.incidents,
      items: Object.entries(s.incidents ?? {}).map(([tipo, n]) => ({
        key: tipo,
        label: `${incidentLabel(tipo)} · ${n}`,
        used: USED_INCIDENTS.has(tipo),
        title: `${n} no jogo`,
      })),
      available: Object.keys(s.incidents ?? {}).length,
      missingLabel: incidentLabel,
    },
    {
      title: "Jogadores",
      unit: "métricas",
      extra:
        s.lineups &&
        `${s.lineups.players} jogadores · escalação ${s.lineups.confirmed ? "confirmada" : "não confirmada"}`,
      on: t.lineups,
      items: players.map((k) => ({
        key: k.key,
        label: playerLabel(k.key),
        used: k.used,
        title: `Exemplo no jogo: ${k.example}`,
      })),
      missing: s.missing?.lineups,
      available: s.lineups?.confirmed ? players.length : 0,
      missingLabel: playerLabel,
    },
  ];
  // Fora do futebol o scanner não busca nada disso: mostra só o que veio.
  const sections = football ? all : all.filter((x) => x.items.length);
  const usedCount = (items: CoverageItem[]) =>
    items.filter((i) => i.used).length;
  // Abre no que a conferência usa; sem nada usado (fora do futebol), abre em tudo.
  const effective =
    mode ?? (sections.some((x) => usedCount(x.items)) ? "used" : "all");

  return box(
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 min-w-0 space-y-1">
          <p className={COLUMN_HEAD}>Cobertura de dados</p>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="hidden sm:inline text-[13px] opacity-55">
              Jogo de amostra
            </span>
            <span className="text-[15px] font-medium tabular-nums">
              {home} {s.event.score} {away} · {formatSaoPaulo(s.event.startAt)}
            </span>
            <span className="text-xs opacity-45">
              amostrado em {formatSaoPaulo(data.sampleAt)}
            </span>
          </p>
        </div>
        <div
          className="flex p-[3px] gap-[3px] rounded-lg border border-border"
          role="radiogroup"
        >
          {(
            [
              ["used", "Só os utilizados"],
              ["all", "Todos disponíveis"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={effective === id}
              onClick={() => setMode(id)}
              className={cn(
                "flex-1 sm:flex-none h-10 sm:h-7 px-3 rounded-md border text-[13.5px] sm:text-[12.5px] whitespace-nowrap transition-colors",
                effective === id
                  ? "border-foreground/10 bg-foreground/[0.1] text-foreground"
                  : "border-transparent text-foreground/55 hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
        <span className="flex items-center gap-2">
          <span className="h-5 px-1.5 rounded-md border border-border text-[11px] text-foreground/60 flex items-center">
            Aa
          </span>
          <span className="opacity-60">o SofaScore oferece</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-success text-success-foreground flex items-center justify-center">
            <Check size={11} weight="bold" />
          </span>
          <span className="opacity-60">o scanner busca (caixa na linha)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-5 px-1.5 rounded-md border border-accent/60 bg-accent/20 text-[11px] flex items-center">
            Aa
          </span>
          <span className="opacity-60">a conferência automática usa</span>
        </span>
      </div>

      {!football && (
        <div className="flex gap-2.5 rounded-lg bg-foreground/[0.05] px-3 py-2.5 text-[13px] text-foreground/60">
          <Info size={16} className="shrink-0 mt-px" />
          O SofaScore oferece estes dados, mas em {t.sportName} o scanner
          coleta só o placar. Nada aqui chega à conferência.
        </div>
      )}

      {sections.map((sec) => {
        const on = football && t.isActive && sec.on;
        const used = usedCount(sec.items);
        const list =
          effective === "all" ? sec.items : sec.items.filter((i) => i.used);
        const missing = sec.available ? (sec.missing ?? []) : [];
        const hidden = effective === "used" ? sec.items.length - used : 0;
        return (
          <div
            key={sec.title}
            className="grid gap-3 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6 pt-3.5 border-t border-border/60"
          >
            <div className="space-y-2">
              <p className="text-[13.5px] font-medium">{sec.title}</p>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[12.5px] tabular-nums">
                <dt className="opacity-45">SofaScore oferece</dt>
                <dd>
                  {sec.items.length} {sec.unit}
                  {sec.extra && ` · ${sec.extra}`}
                </dd>
                <dt className="opacity-45">Scanner busca</dt>
                <dd
                  className={cn(
                    "flex items-center gap-1.5",
                    on ? "text-success" : "text-foreground/55",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      on ? "bg-success" : "bg-foreground/25",
                    )}
                  />
                  {football ? (on ? "ligado" : "desligado") : "só placar"}
                </dd>
                <dt className="opacity-45">Conferência usa</dt>
                <dd className="text-accent">
                  {used} de {sec.items.length}
                </dd>
              </dl>
              {football && (
                <Diagnosis
                  on={on}
                  missing={sec.missing}
                  available={sec.available}
                  label={sec.missingLabel}
                />
              )}
            </div>
            <div className="flex flex-wrap content-start gap-1.5 min-w-0">
              {list.map((i) => (
                <Chip
                  key={i.key}
                  used={i.used}
                  dim={football && !on}
                  title={i.title}
                >
                  {i.label}
                </Chip>
              ))}
              {missing.map((k) => (
                <Chip
                  key={k}
                  missing
                  title="O SofaScore omite estatística zerada: pode ter sido zero neste jogo."
                >
                  {sec.missingLabel(k)} · não veio
                </Chip>
              ))}
              {hidden > 0 && (
                <button
                  type="button"
                  onClick={() => setMode("all")}
                  className="h-8 sm:h-[26px] px-2.5 rounded-md text-[12.5px] text-foreground/55 hover:text-foreground hover:bg-foreground/[0.05] transition"
                >
                  +{hidden} oferecidos, não usados
                </button>
              )}
              {!list.length && !missing.length && !hidden && (
                <span className="h-[26px] flex items-center text-[12.5px] opacity-45">
                  {sec.items.length
                    ? "Nenhum item usado pela conferência."
                    : "O SofaScore não trouxe nada nesta seção."}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <p className="text-xs opacity-45">
        Passe o mouse num chip pra ver o valor no jogo de amostra.
      </p>
    </>,
  );
}

function TournamentRow({
  t,
  onDelete,
}: {
  t: ScannerTournament;
  onDelete: () => void;
}) {
  const setFlag = useSetFlag();
  const [open, setOpen] = useState(false);
  const label = collectLabel(t);
  const flags = t.sportName === FACTS_SPORT ? FLAGS : FLAGS.slice(0, 1);
  const warning = coverageWarning(t);
  const quiet = !t.isActive || !t.lastCheckAt || t.lastEvents === 0;

  return (
    <>
      <div
        className={cn(
          GRID,
          "relative flex flex-col gap-0.5 px-4 sm:px-6 pt-2.5 pb-1 sm:py-0 sm:h-[50px] border-b border-border/60",
          open && "bg-accent/[0.06]",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 pr-24 sm:pr-0 sm:flex-nowrap">
          <span className="text-[15px] sm:text-sm font-medium sm:truncate">
            {t.name}
          </span>
          <span className="text-xs tabular-nums opacity-40">#{t.id}</span>
          {warning && (
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[11.5px]",
                ORANGE,
                ORANGE_BG,
              )}
              title={warning}
            >
              <Warning size={12} /> sem cobertura
            </span>
          )}
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 text-[13px] sm:text-[13.5px] tabular-nums cursor-help whitespace-nowrap",
            label.alert
              ? ORANGE
              : quiet
                ? "text-foreground/55"
                : "text-foreground/55 sm:text-foreground",
          )}
          title={collectTitle(t)}
        >
          {label.alert && <Warning size={14} />}
          {label.text}
        </span>
        <div className="grid grid-cols-4 gap-1 -mx-1.5 mt-1 sm:mx-0 sm:mt-0 sm:contents">
          {flags.map((f) => (
            <FlagBox
              key={f.key}
              checked={t[f.key]}
              label={f.short}
              title={`${f.label} em ${t.name}: ${f.hint}`}
              // Sem coleta não há jogo pra buscar dado extra: a caixa fica, apagada.
              dim={f.key !== "isActive" && !t.isActive}
              onChange={() => setFlag({ id: t.id }, f.key, !t[f.key])}
            />
          ))}
          {t.sportName !== FACTS_SPORT && onlyScore}
        </div>
        <div className="absolute right-2 top-1 sm:static flex justify-end gap-0.5 sm:-mr-1.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              ICON_BUTTON,
              open && "bg-accent/20 text-accent hover:bg-accent/25 hover:text-accent",
            )}
            aria-expanded={open}
            aria-label={`Ver cobertura de dados de ${t.name}`}
            title="Ver cobertura de dados"
          >
            <Database size={17} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={cn(
              ICON_BUTTON,
              "hover:text-danger hover:bg-danger/10",
            )}
            aria-label={`Excluir ${t.name}`}
            title="Excluir"
          >
            <Trash size={17} />
          </button>
        </div>
      </div>
      {open && <CoveragePanel t={t} />}
    </>
  );
}

function NewTournamentForm({
  existing,
  onDone,
}: {
  existing: ScannerTournament[];
  onDone: (created: boolean) => void;
}) {
  const create = useCreateAdminScanner();
  const sports = useSports();
  const [raw, setRaw] = useState("");
  const [name, setName] = useState("");
  const [sportId, setSportId] = useState("");
  const id = parseTournamentId(raw);
  const dup = id ? existing.find((t) => t.id === id) : undefined;
  const ready = !!id && !dup && name.trim().length >= 2 && !!sportId;

  const changeRaw = (value: string) => {
    setRaw(value);
    // Só sugere enquanto o nome não foi digitado à mão.
    if (!name || name === nameFromUrl(raw)) setName(nameFromUrl(value));
    const sport = sports.find((s) => s.name === sportFromUrl(value));
    if (sport) setSportId(String(sport.id));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || !id) return;
    create.mutate(
      { id, name: name.trim(), sportId: Number(sportId) },
      {
        onSuccess: () => {
          actionToast.success({
            title: `${name.trim()} cadastrada`,
            description: "Aguardando coleta: entra na próxima rodada.",
          });
          onDone(true);
        },
        onError: (err) =>
          actionToast.error({
            description: getErrorMessage(err, "Não foi possível cadastrar."),
          }),
      },
    );
  };

  const hint: ["info" | "warn" | "ok", string] = !raw.trim()
    ? [
        "info",
        "Ache o torneio no sofascore.com e cole a URL: o id é o número no fim, antes do #.",
      ]
    : !id
      ? ["warn", "Não achei o id. Cole a URL do torneio ou só o número."]
      : dup
        ? ["warn", `Esse id já está cadastrado: ${dup.name}`]
        : [
            "ok",
            `id ${id} encontrado${nameFromUrl(raw) ? " · nome sugerido a partir da URL" : ""}`,
          ];

  return (
    <form
      onSubmit={submit}
      className="px-4 sm:px-6 py-3.5 border-b border-border bg-foreground/[0.03] space-y-2"
    >
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_190px_auto_auto]">
        <Input
          value={raw}
          onChange={(e) => changeRaw(e.target.value)}
          placeholder="URL do torneio no SofaScore ou o id"
          aria-label="URL do torneio no SofaScore ou o id"
          aria-invalid={raw.trim() !== "" && (!id || !!dup)}
          autoFocus
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          aria-label="Nome"
        />
        <Select value={sportId} onValueChange={setSportId}>
          <SelectTrigger aria-label="Esporte">
            <SelectValue placeholder="Esporte" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={create.isPending || !ready}>
          Cadastrar
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="hidden sm:inline-flex"
          onClick={() => onDone(false)}
          aria-label="Cancelar cadastro"
          title="Cancelar"
        >
          <X size={15} />
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Note tone={hint[0]}>{hint[1]}</Note>
        <button
          type="button"
          onClick={() => onDone(false)}
          className="sm:hidden h-11 px-2 text-sm opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** O que cada coluna significa: fica num (i) em vez de texto fixo ocupando o topo. */
function LegendPopover() {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex items-center justify-center align-middle ml-1.5 w-7 h-7 rounded-md text-foreground/55 hover:text-foreground hover:bg-foreground/[0.06] transition"
        aria-label="Legenda das colunas"
        title="Legenda das colunas"
      >
        <Info size={17} />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(420px,calc(100vw-32px))] space-y-2.5"
      >
        <p className={COLUMN_HEAD}>Legenda das colunas</p>
        {LEGEND.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 text-[13px] leading-snug"
          >
            <span className="font-medium">{k}</span>
            <span className="opacity-60">{v}</span>
          </div>
        ))}
        <p className="pt-2 border-t border-border text-[12.5px] opacity-60">
          Fora do futebol, o scanner coleta só o placar.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function AdminScanner() {
  const { data, isPending, isError, refetch } = useAdminScanner();
  const remove = useDeleteAdminScanner();
  const setFlag = useSetFlag();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusId | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<ScannerTournament | null>(null);
  const [statusSheet, setStatusSheet] = useState(false);
  const isMobile = useIsMobile();

  const all = data ?? [];
  const sports = [...new Set(all.map((t) => t.sportName))].map((name) => ({
    name,
    rows: all.filter((t) => t.sportName === name),
  }));
  const term = search.trim().toLowerCase();
  const statusTest = STATUS_FILTERS.find((f) => f.id === status)?.test;
  const matchSearch = (t: ScannerTournament) =>
    !term || t.name.toLowerCase().includes(term) || String(t.id).includes(term);
  const visible = (t: ScannerTournament) =>
    matchSearch(t) && (!statusTest || statusTest(t));
  // Contagens seguem os outros filtros: chip mostra o que vai aparecer ao clicar.
  const sportCount = (name: string | null) =>
    all.filter((t) => (!name || t.sportName === name) && visible(t)).length;
  const inSport = all.filter(
    (t) => matchSearch(t) && (!sport || t.sportName === sport),
  );
  // O cabeçalho do grupo age e conta sobre o esporte inteiro; busca e estado só escondem linhas.
  const groups = sports
    .filter((g) => !sport || g.name === sport)
    .filter((g) => g.rows.some(visible));
  const summary = collectSummary(all);
  const lastRun = ageParts(summary.lastCheckAt);
  const active = all.filter((t) => t.isActive).length;
  const filtered = !!term || sport !== null || status !== null;
  const statusLabel =
    STATUS_FILTERS.find((f) => f.id === status)?.label ?? "Todos";
  const statusOptions = [
    { id: "all", label: "Todos", n: inSport.length, warn: false },
    ...STATUS_FILTERS.map((f) => {
      const n = inSport.filter(f.test).length;
      // Laranja só quando há o que olhar; zero fica neutro.
      const warn = (f.id === "problem" || f.id === "coverage") && n > 0;
      return { id: f.id, label: f.label, n, warn };
    }),
  ];

  const clearFilters = () => {
    setSearch("");
    setSport(null);
    setStatus(null);
  };

  const toggleGroup = (name: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(name)) next.add(name);
      return next;
    });

  const confirmDelete = () => {
    if (!deleting) return;
    const t = deleting;
    remove.mutate(t.id, {
      onSuccess: () => actionToast.success({ title: `${t.name} excluída` }),
      onError: (err) =>
        actionToast.error({
          description: getErrorMessage(err, "Não foi possível excluir."),
        }),
    });
    setDeleting(null);
  };

  const pauseInstead = () => {
    if (!deleting) return;
    setFlag(
      { id: deleting.id },
      "isActive",
      false,
      `Coleta desmarcada · ${deleting.name} fica pausada`,
    );
    setDeleting(null);
  };

  return (
    <>
      <AdminPanel
        eyebrow="Scanner SofaScore"
        title={
          data ? (
            <>
              {/* "71 de 71" é redundante: o "de" só aparece com pausada. */}
              {active === all.length
                ? `${all.length} competições ativas`
                : `${active} de ${all.length} ativas`}
              <LegendPopover />
            </>
          ) : (
            "Competições no scanner"
          )
        }
        description={
          data && (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
              <span
                title={
                  summary.lastCheckAt
                    ? `Última coleta: ${formatSaoPaulo(summary.lastCheckAt)}`
                    : undefined
                }
              >
                {summary.lastCheckAt
                  ? `Última coleta há ${lastRun.value} ${lastRun.unit}`
                  : "Nunca coletado"}{" "}
                · {formatInt(summary.games)} jogos ·{" "}
                {summary.empty} sem jogos
              </span>
              <span className="hidden sm:inline">·</span>
              {summary.problems > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStatus("problem");
                    setSport(null);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 sm:h-6 px-2 sm:-ml-1 rounded-md transition hover:brightness-125",
                    ORANGE,
                    ORANGE_BG,
                  )}
                >
                  <Warning size={14} />
                  {summary.problems}{" "}
                  {summary.problems === 1 ? "problema" : "problemas"}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Tudo OK
                </span>
              )}
            </span>
          )
        }
        actions={
          <>
            <div className="relative flex-1 sm:w-[260px]">
              <MagnifyingGlass
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-45"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nome ou id"
                aria-label="Buscar nome ou id"
                className="pl-9 h-11 sm:h-9 rounded-lg"
              />
            </div>
            <Button
              onClick={() => setAdding((v) => !v)}
              className="shrink-0 w-11 px-0 h-11 sm:w-auto sm:h-9 sm:px-3.5 rounded-lg gap-1.5 text-[13.5px] bg-accent text-white hover:bg-accent/90 hover:opacity-100 [&_svg]:size-3.5"
              aria-label="Cadastrar competição"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Competição</span>
            </Button>
          </>
        }
        filters={
          data && (
            // Celular: uma linha só, rolando de lado, com o Status na frente.
            <div className="flex w-[calc(100%+2rem)] sm:w-full items-center gap-1.5 overflow-x-auto [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible [&>*]:shrink-0">
              <FilterChip
                active={sport === null}
                count={sportCount(null)}
                onClick={() => setSport(null)}
              >
                Todos
              </FilterChip>
              {[...sports]
                .sort((a, b) => b.rows.length - a.rows.length)
                .filter((g) => sport === g.name || sportCount(g.name) > 0)
                .map((g) => (
                  <FilterChip
                    key={g.name}
                    active={sport === g.name}
                    count={sportCount(g.name)}
                    onClick={() => setSport(g.name)}
                  >
                    {g.name}
                  </FilterChip>
                ))}
              {/* Estado num dropdown só: segunda fileira de chips pesava o topo. */}
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setStatusSheet(true)}
                  className="order-first flex items-center gap-1.5 h-9 pl-3 pr-2.5 rounded-lg border border-border text-sm whitespace-nowrap"
                >
                  <span className="opacity-55">Status</span>
                  {statusLabel}
                  <CaretDown size={12} className="opacity-55" />
                </button>
              ) : (
                <Select
                  value={status ?? "all"}
                  onValueChange={(v) =>
                    setStatus(v === "all" ? null : (v as StatusId))
                  }
                >
                  <SelectTrigger
                    aria-label="Filtrar por status"
                    className="h-8 w-auto ml-auto gap-2 text-sm whitespace-nowrap"
                  >
                    <span className="opacity-55">Status</span>
                    {/* Texto próprio em vez de SelectValue: o item tem a contagem, o botão não. */}
                    <span>{statusLabel}</span>
                  </SelectTrigger>
                  <SelectContent align="end">
                    {statusOptions.map((o) => (
                      <SelectItem
                        key={o.id}
                        value={o.id}
                        className="py-1 data-[state=checked]:bg-foreground/[0.06] [&>span:last-child]:flex-1"
                      >
                        <span className="flex items-center justify-between gap-6">
                          <span>{o.label}</span>
                          <span
                            className={cn(
                              "tabular-nums text-xs",
                              o.warn ? ORANGE : "opacity-50",
                            )}
                          >
                            {o.n}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )
        }
      >
        {isPending ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" delay={i * 60} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            bare
            title="Não foi possível carregar o scanner"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void refetch()}
              >
                Tentar de novo
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden sm:block border-b border-border">
              <div className={cn(GRID, "px-6 pt-2")}>
                <span className="col-start-3 col-span-4 mx-2.5 pb-1 border-b border-foreground/15 text-center text-[11px] tracking-[0.08em] opacity-40">
                  o que o scanner busca
                </span>
              </div>
              <div className={cn(GRID, "px-6 h-8")}>
                <span className={COLUMN_HEAD}>Competição</span>
                <span className={COLUMN_HEAD}>Próximos 30 dias</span>
                {FLAGS.map((f) => (
                  <span
                    key={f.key}
                    className={cn(COLUMN_HEAD, "text-center")}
                    title={f.hint}
                  >
                    {f.label}
                  </span>
                ))}
                <span />
              </div>
            </div>
            {adding && (
              <NewTournamentForm
                existing={all}
                onDone={(created) => {
                  setAdding(false);
                  // A nova entra sem jogos: limpa o filtro pra ela aparecer.
                  if (created) clearFilters();
                }}
              />
            )}
            {groups.length === 0 ? (
              <EmptyState
                bare
                title={
                  filtered
                    ? "Nenhuma competição com esses filtros"
                    : "Nenhuma competição no scanner"
                }
                action={
                  filtered && (
                    <Button variant="secondary" size="sm" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  )
                }
              />
            ) : (
              groups.map((g) => (
                <div key={g.name}>
                  <SportHeader
                    sport={g.name}
                    rows={g.rows}
                    collapsed={collapsed.has(g.name)}
                    onToggle={() => toggleGroup(g.name)}
                  />
                  {!collapsed.has(g.name) &&
                    g.rows
                      .filter(visible)
                      .map((t) => (
                        <TournamentRow
                          key={t.id}
                          t={t}
                          onDelete={() => setDeleting(t)}
                        />
                      ))}
                </div>
              ))
            )}
          </>
        )}
      </AdminPanel>

      <BottomSheet
        open={statusSheet}
        onOpenChange={setStatusSheet}
        title="Status"
      >
        <div className="flex flex-col gap-0.5 py-2">
          {statusOptions.map((o) => (
            <OptionRow
              key={o.id}
              label={o.label}
              count={o.n}
              selected={(status ?? "all") === o.id}
              onToggle={() => {
                setStatus(o.id === "all" ? null : (o.id as StatusId));
                setStatusSheet(false);
              }}
            />
          ))}
        </div>
      </BottomSheet>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Use só pra cadastro incorreto. Pra parar de coletar, desmarque
              Coleta. Excluir remove a configuração, e apostas pendentes em
              jogos desta competição voltam a buscar todos os dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="secondary"
              className="sm:mr-auto"
              onClick={pauseInstead}
            >
              Desmarcar Coleta
            </Button>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={buttonVariants({ variant: "destructive" })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
