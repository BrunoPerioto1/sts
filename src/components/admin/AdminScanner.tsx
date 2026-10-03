import { useState } from "react";
import {
  CheckCircle,
  Database,
  Info,
  MagnifyingGlass,
  Plus,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { ageParts, formatSaoPaulo } from "@/lib/admin-health";
import {
  collectLabel,
  collectSummary,
  hasProblem,
  nameFromUrl,
  parseTournamentId,
} from "@/lib/scanner";
import {
  groupLabel,
  incidentLabel,
  playerLabel,
  statLabel,
} from "@/lib/scanner-labels";
import type { ScannerFlag, ScannerTournament } from "@/api/routes/get-admin";
import { cn } from "@/lib/utils";

const FLAGS: { key: ScannerFlag; label: string; hint: string }[] = [
  {
    key: "isActive",
    label: "Coleta",
    hint: "Busca os próximos jogos (é o que casa a aposta com o jogo)",
  },
  {
    key: "statistics",
    label: "Estatísticas",
    hint: "Depois do jogo: escanteios, chutes, cartões, faltas",
  },
  {
    key: "incidents",
    label: "Lances",
    hint: "Depois do jogo: ordem dos gols, pênaltis, vermelhos",
  },
  {
    key: "lineups",
    label: "Jogadores",
    hint: "Depois do jogo: gols, assistências, chutes por jogador",
  },
];

// O results.py só busca dado extra de jogo de futebol com placar fechado: nos
// outros esportes essas três colunas não mudam nada, então nem aparecem.
const FACTS_SPORT = "Futebol";

const GRID =
  "sm:grid sm:items-center sm:gap-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_repeat(4,76px)_60px]";

const ICON_BUTTON =
  "w-7 h-7 flex items-center justify-center rounded-md opacity-45 hover:opacity-100 hover:bg-foreground/[0.07] transition";

const FAILURE: Record<string, string> = {
  blocked: "bloqueio do SofaScore ou do proxy",
  error: "erro na coleta (ver log do Actions)",
};

const GAP_LABEL = {
  statistics: "Estatísticas do jogo",
  lineups: "Jogadores",
} as const;

/**
 * ⚠ da linha: no futebol, seção da amostra que veio inteira vazia. É o que diz
 * "a conferência automática não vai liquidar estes mercados nesta liga".
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
  if (t.lastCheckStatus === "invalid_id")
    return "O SofaScore não achou esse id. Confira o número no fim da URL do torneio.";
  if (t.lastCheckStatus === "blocked" || t.lastCheckStatus === "error") {
    return `Última tentativa ${formatSaoPaulo(t.lastCheckAt)}: ${FAILURE[t.lastCheckStatus]}. Última coleta válida: ${formatSaoPaulo(t.lastEventsAt)}.`;
  }
  if (t.lastCheckStatus === "ok" && t.lastEvents === 0) {
    return `Nenhum jogo nos próximos 30 dias: fora de temporada ou pausa no calendário. Coletado ${formatSaoPaulo(t.lastCheckAt)}.`;
  }
  if (t.lastCheckAt) return `Coletado ${formatSaoPaulo(t.lastCheckAt)}`;
  return undefined;
}

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
  onChange,
}: {
  checked: boolean | "indeterminate";
  label: string;
  title: string;
  onChange: () => void;
}) {
  // No celular as colunas somem: o rótulo vai do lado do checkbox.
  return (
    <label
      className="flex items-center gap-1.5 text-xs sm:justify-center"
      title={title}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        aria-label={title}
      />
      <span className="sm:hidden opacity-70">{label}</span>
    </label>
  );
}

function SportHeader({
  sport,
  rows,
}: {
  sport: string;
  rows: ScannerTournament[];
}) {
  const setFlag = useSetFlag();
  const flags = sport === FACTS_SPORT ? FLAGS : FLAGS.slice(0, 1);
  const target = { sportId: rows[0].sportId };
  const scope = `${rows.length} ${rows.length === 1 ? "competição" : "competições"} de ${sport}`;

  return (
    <div
      className={cn(
        GRID,
        // Separador de categoria: fundo mais forte, faixa de destaque à
        // esquerda e respiro em cima, pra não se confundir com uma linha.
        "px-4 sm:px-6 py-3 border-y border-border border-l-2 border-l-accent bg-foreground/[0.07] flex flex-col gap-2",
      )}
    >
      <span className="flex items-center gap-2 min-w-0">
        <SportIcon name={sport} size={16} className="shrink-0 opacity-80" />
        <span className="text-sm font-semibold uppercase tracking-[0.06em]">
          {sport}
        </span>
        <span className="text-xs tabular-nums px-1.5 py-0.5 rounded bg-foreground/[0.08] opacity-70">
          {rows.length}
        </span>
      </span>
      <span className="hidden sm:block" />
      <div className="flex flex-wrap gap-3 sm:contents">
        {flags.map((f) => {
          const on = rows.filter((r) => r[f.key]).length;
          const all = on === rows.length;
          // Ação sobre o que existe hoje: competição cadastrada depois entra com tudo ligado.
          const title = `${all ? "Desativar" : "Ativar"} ${f.label} nas ${scope}`;
          return (
            <FlagBox
              key={f.key}
              checked={all ? true : on === 0 ? false : "indeterminate"}
              label={f.label}
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
        {sport !== FACTS_SPORT && (
          <span className="text-xs opacity-40 sm:col-span-3">só placar</span>
        )}
      </div>
      <span className="hidden sm:block" />
    </div>
  );
}

function Chip({
  used,
  title,
  children,
}: {
  used?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "text-xs px-2 py-0.5 rounded-md border",
        used
          ? "border-accent/60 bg-accent/10 text-foreground"
          : "border-border opacity-60",
      )}
    >
      {children}
    </span>
  );
}

/** "Dá pra liquidar?": o que o motor precisa e esta liga não entregou. */
// Amostra é um jogo só, e o SofaScore omite estatística zerada: chave ausente
// numa seção que veio pode ser zero naquele jogo, não falta de cobertura. Só a
// seção inteira vazia é falta certa.
function Diagnosis({
  missing,
  available,
  label,
}: {
  missing?: string[];
  available: number;
  label: (key: string) => string;
}) {
  if (!missing) return null;
  if (missing.length === 0)
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <CheckCircle size={13} weight="fill" /> tudo que a conferência precisa
      </span>
    );
  if (available === 0)
    return (
      <span className="flex items-center gap-1 text-xs text-[var(--dashboard-orange)]">
        <Warning size={13} weight="fill" /> sem cobertura: a conferência não
        liquida estes mercados nesta liga
      </span>
    );
  return (
    <span
      className="text-xs opacity-55"
      title="O SofaScore omite estatística zerada: pode ter sido zero neste jogo. Só é falta de cobertura se a seção inteira não vier."
    >
      não vieram neste jogo (pode ter sido zero):{" "}
      {missing.map(label).join(", ")}
    </span>
  );
}

function SampleSection({
  title,
  notes,
  diagnosis,
  children,
}: {
  title: string;
  notes: (string | false | undefined)[];
  diagnosis?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className={COLUMN_HEAD}>{title}</p>
        <span className="text-xs opacity-50">
          {notes.filter(Boolean).join(" · ")}
        </span>
        {diagnosis}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
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

const absent = <span className="text-xs opacity-45">não vem nesta liga</span>;

/**
 * Cobertura de dados: o que o SofaScore entrega pra competição (amostra.py,
 * um jogo encerrado), o que o scanner busca (flags da linha) e o que a
 * conferência automática usa. Três coisas diferentes, separadas na tela.
 */
function CoveragePanel({ t }: { t: ScannerTournament }) {
  const { data, isPending, isError } = useAdminScannerSample(t.id, true);
  const [mode, setMode] = useState<"used" | "all" | null>(null);
  const box = (children: React.ReactNode) => (
    <div className="px-4 sm:px-6 py-3 border-b border-border bg-foreground/[0.02] space-y-3 text-sm">
      {children}
    </div>
  );
  if (isPending) return box(<Skeleton className="h-16 rounded-lg" />);
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
  const stats = s.statistics ?? [];
  const players = s.lineups?.keys ?? [];
  const incidents = Object.entries(s.incidents ?? {}).map(([tipo, n]) => ({
    tipo,
    n,
    used: USED_INCIDENTS.has(tipo),
  }));
  const usedCount = (list: { used: boolean }[]) =>
    list.filter((i) => i.used).length;
  // Abre no que a conferência usa; sem nada usado (fora do futebol), abre em tudo.
  const effective =
    mode ??
    (usedCount(stats) + usedCount(players) + usedCount(incidents)
      ? "used"
      : "all");
  const pick = <T extends { used: boolean }>(list: T[]) =>
    effective === "all" ? list : list.filter((i) => i.used);
  const empty = (list: { used: boolean }[]) =>
    list.length ? (
      <span className="text-xs opacity-45">nada que a conferência usa</span>
    ) : (
      absent
    );
  const scanner = (on: boolean) =>
    football ? `scanner: ${on ? "ligado" : "desligado"}` : undefined;
  const { home, away } = s.event;

  return box(
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className={COLUMN_HEAD}>Cobertura de dados</p>
          <p className="opacity-70">
            Jogo usado como amostra:{" "}
            <span className="font-medium text-foreground">
              {home} {s.event.score} {away}
            </span>{" "}
            · {formatSaoPaulo(s.event.startAt)}
          </p>
          <p className="text-xs opacity-45">
            Amostrado em {formatSaoPaulo(data.sampleAt)}
          </p>
        </div>
        <div
          className="inline-flex overflow-hidden rounded-md border border-border text-xs"
          role="radiogroup"
        >
          {(
            [
              ["used", "Só os utilizados"],
              ["all", "Todos disponíveis"],
            ] as const
          ).map(([id, label], i) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={effective === id}
              onClick={() => setMode(id)}
              className={cn(
                "px-2.5 py-1 transition-colors",
                i > 0 && "border-l border-border",
                effective === id
                  ? "bg-foreground/[0.08] text-foreground"
                  : "opacity-55 hover:opacity-100",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!football && (
        <p className="text-xs opacity-60">
          O SofaScore fornece estes dados, mas o scanner deste esporte coleta só
          o placar: a conferência automática só avalia futebol.
        </p>
      )}

      <SampleSection
        title="Estatísticas do jogo"
        notes={[
          `${stats.length} disponíveis`,
          `${usedCount(stats)} usadas`,
          scanner(t.statistics),
        ]}
        diagnosis={
          football && (
            <Diagnosis
              missing={s.missing?.statistics}
              available={stats.length}
              label={(k) => statLabel(k, k)}
            />
          )
        }
      >
        {pick(stats).length
          ? pick(stats).map((i) => (
              <Chip
                key={i.key}
                used={i.used}
                title={`${home}: ${String(i.home)} · ${away}: ${String(i.away)} (${groupLabel(i.group)})`}
              >
                {statLabel(i.key, i.name)}
              </Chip>
            ))
          : empty(stats)}
      </SampleSection>

      <SampleSection
        title="Lances"
        notes={[
          `${incidents.length} tipos encontrados`,
          `${usedCount(incidents)} usados`,
          scanner(t.incidents),
        ]}
      >
        {pick(incidents).length
          ? pick(incidents).map(({ tipo, n, used }) => (
              <Chip key={tipo} used={used}>
                {incidentLabel(tipo)} · {n}
              </Chip>
            ))
          : empty(incidents)}
      </SampleSection>

      <SampleSection
        title="Jogadores"
        notes={[
          s.lineups && `${s.lineups.players} jogadores`,
          s.lineups &&
            `escalação ${s.lineups.confirmed ? "confirmada" : "não confirmada"}`,
          `${players.length} métricas disponíveis`,
          `${usedCount(players)} usadas`,
          scanner(t.lineups),
        ]}
        diagnosis={
          football && (
            <Diagnosis
              missing={s.missing?.lineups}
              available={s.lineups?.confirmed ? players.length : 0}
              label={playerLabel}
            />
          )
        }
      >
        {pick(players).length
          ? pick(players).map((k) => (
              <Chip
                key={k.key}
                used={k.used}
                title={`Exemplo no jogo: ${k.example}`}
              >
                {playerLabel(k.key)}
              </Chip>
            ))
          : empty(players)}
      </SampleSection>

      <p className="text-xs opacity-45">
        Destacado = a conferência automática usa. Passe o mouse pra ver o valor
        do jogo.
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

  return (
    <>
      <div
        className={cn(
          GRID,
          "px-4 sm:px-6 py-2.5 border-b border-border last:border-b-0 flex flex-col gap-2 min-h-[46px]",
        )}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <span
            className={cn(
              "text-sm font-medium truncate",
              !t.isActive && "opacity-45",
            )}
          >
            {t.name}
          </span>
          <span className="text-xs tabular-nums opacity-30">#{t.id}</span>
          {coverageWarning(t) && (
            <span
              className="self-center text-[var(--dashboard-orange)]"
              title={coverageWarning(t)!}
              aria-label={coverageWarning(t)!}
            >
              <Warning size={13} weight="fill" />
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-sm tabular-nums",
            label.alert ? "text-[var(--dashboard-orange)]" : "opacity-60",
          )}
          title={collectTitle(t)}
        >
          {label.text}
        </span>
        <div className="flex flex-wrap gap-3 sm:contents">
          {flags.map((f) => (
            <FlagBox
              key={f.key}
              checked={t[f.key]}
              label={f.label}
              title={`${f.label} em ${t.name}: ${f.hint}`}
              onChange={() => setFlag({ id: t.id }, f.key, !t[f.key])}
            />
          ))}
          {t.sportName !== FACTS_SPORT && (
            <span className="text-xs opacity-40 sm:col-span-3">só placar</span>
          )}
        </div>
        <div className="flex justify-end gap-1 -mr-1.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              ICON_BUTTON,
              open && "opacity-100 bg-foreground/[0.07]",
            )}
            aria-expanded={open}
            aria-label={`Ver cobertura de dados de ${t.name}`}
            title="Ver cobertura de dados"
          >
            <Database size={15} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={ICON_BUTTON}
            aria-label={`Excluir ${t.name}`}
            title="Excluir"
          >
            <Trash size={15} />
          </button>
        </div>
      </div>
      {open && <CoveragePanel t={t} />}
    </>
  );
}

function NewTournamentForm({ onDone }: { onDone: () => void }) {
  const create = useCreateAdminScanner();
  const sports = useSports();
  const [raw, setRaw] = useState("");
  const [name, setName] = useState("");
  const [sportId, setSportId] = useState("");
  const id = parseTournamentId(raw);

  const changeRaw = (value: string) => {
    setRaw(value);
    // Só sugere enquanto o nome não foi digitado à mão.
    if (!name || name === nameFromUrl(raw)) setName(nameFromUrl(value));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || name.trim().length < 2 || !sportId) return;
    create.mutate(
      { id, name: name.trim(), sportId: Number(sportId) },
      {
        onSuccess: () => {
          actionToast.success({
            title: `${name.trim()} no scanner`,
            description: "Entra na próxima coleta (seg ou qui).",
          });
          onDone();
        },
        onError: (err) =>
          actionToast.error({
            description: getErrorMessage(err, "Não foi possível cadastrar."),
          }),
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="px-4 sm:px-6 py-3 border-b border-border bg-accent/[0.04] space-y-2"
    >
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_180px_auto]">
        <Input
          value={raw}
          onChange={(e) => changeRaw(e.target.value)}
          placeholder="URL do torneio no SofaScore ou o id"
          aria-invalid={raw.trim() !== "" && !id}
          autoFocus
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
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
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={
              create.isPending || !id || name.trim().length < 2 || !sportId
            }
          >
            Cadastrar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDone}
            aria-label="Cancelar"
          >
            <X size={14} />
          </Button>
        </div>
      </div>
      <p className="text-xs opacity-50">
        {raw.trim() && !id
          ? "Não achei o id: é o número no fim da URL do torneio, antes do #."
          : id
            ? `Torneio #${id}.`
            : "Ache o torneio no sofascore.com e cole a URL: o id é o número no fim, antes do #."}
      </p>
    </form>
  );
}

/** O que cada coluna significa: fica num (i) em vez de texto fixo ocupando o topo. */
function LegendPopover() {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex align-middle ml-1.5 opacity-45 hover:opacity-100 transition"
        aria-label="O que cada coluna significa"
      >
        <Info size={15} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 text-sm space-y-1.5">
        <p>
          <span className="font-medium">Coleta</span>: busca os próximos jogos
          (seg e qui). É o que casa a aposta com o jogo.
        </p>
        <p>
          <span className="font-medium">Estatísticas</span>,{" "}
          <span className="font-medium">Lances</span> e{" "}
          <span className="font-medium">Jogadores</span>: o que buscar depois do
          jogo, além do placar, pra conferência automática. Só futebol.
        </p>
        <p className="opacity-60">
          Cada um custa 1 request a mais por jogo com aposta.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function AdminScanner() {
  const { data, isPending, isError, refetch } = useAdminScanner();
  const remove = useDeleteAdminScanner();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusId | null>(null);
  const [deleting, setDeleting] = useState<ScannerTournament | null>(null);

  const all = data ?? [];
  const sports = [...new Set(all.map((t) => t.sportName))].map((name) => ({
    name,
    rows: all.filter((t) => t.sportName === name),
  }));
  const term = search.trim().toLowerCase();
  const statusTest = STATUS_FILTERS.find((f) => f.id === status)?.test;
  const visible = (t: ScannerTournament) =>
    (!term ||
      t.name.toLowerCase().includes(term) ||
      String(t.id).includes(term)) &&
    (!statusTest || statusTest(t));
  // O cabeçalho do grupo age e conta sobre o esporte inteiro; busca e estado só escondem linhas.
  const groups = sports
    .filter((g) => !sport || g.name === sport)
    .filter((g) => g.rows.some(visible));
  const summary = collectSummary(all);
  const lastRun = ageParts(summary.lastCheckAt);
  const active = all.filter((t) => t.isActive).length;

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
              · {summary.games.toLocaleString("pt-BR")} jogos · {summary.empty}{" "}
              sem jogos ·{" "}
              {summary.problems > 0 ? (
                <span className="inline-flex items-center gap-1 text-[var(--dashboard-orange)]">
                  <Warning size={13} weight="fill" />
                  {summary.problems}{" "}
                  {summary.problems === 1 ? "problema" : "problemas"}
                </span>
              ) : (
                "Tudo OK"
              )}
            </span>
          )
        }
        actions={
          <>
            <div className="relative flex-1 sm:w-56">
              <MagnifyingGlass
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-35"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nome ou id"
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => setAdding(true)}
              disabled={adding}
              className="shrink-0"
            >
              <Plus size={14} /> Competição
            </Button>
          </>
        }
        filters={
          data && (
            <>
              <FilterChip
                active={sport === null}
                count={all.length}
                onClick={() => setSport(null)}
              >
                Todos
              </FilterChip>
              {[...sports]
                .sort((a, b) => b.rows.length - a.rows.length)
                .map((g) => (
                  <FilterChip
                    key={g.name}
                    active={sport === g.name}
                    count={g.rows.length}
                    onClick={() => setSport(g.name)}
                  >
                    {g.name}
                  </FilterChip>
                ))}
              {/* Estado num dropdown só: segunda fileira de chips pesava o topo. */}
              <Select
                value={status ?? "all"}
                onValueChange={(v) =>
                  setStatus(v === "all" ? null : (v as StatusId))
                }
              >
                <SelectTrigger
                  aria-label="Filtrar por status"
                  className="h-8 w-auto ml-auto gap-2 text-sm"
                >
                  <span className="opacity-55">Status:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">Todos</SelectItem>
                  {STATUS_FILTERS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label} · {all.filter(f.test).length}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
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
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Tentar de novo
              </Button>
            }
          />
        ) : (
          <>
            <div
              className={cn(GRID, "hidden px-6 py-2.5 border-b border-border")}
            >
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
            {adding && <NewTournamentForm onDone={() => setAdding(false)} />}
            {groups.length === 0 ? (
              <EmptyState
                bare
                title="Nenhuma competição encontrada"
                description={
                  term
                    ? `Nada bate com "${search}".`
                    : "Nenhuma competição neste filtro."
                }
              />
            ) : (
              groups.map((g, i) => (
                <div key={g.name} className={cn(i > 0 && "mt-4")}>
                  <SportHeader sport={g.name} rows={g.rows} />
                  {g.rows.filter(visible).map((t) => (
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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
