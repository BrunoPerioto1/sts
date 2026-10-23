import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Checks, CircleNotch, ListChecks, Minus, X } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SelectCheck } from "@/components/ui/select-check";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultIdEnum } from "@/api/routes/get-bets";
import type { SettlementQueue, SettlementSuggestion } from "@/api/routes/get-settlement";
import {
  useSettlementActions,
  useSettlementQueue,
  useSettlementReview,
  useSettlementSuggestions,
} from "@/hooks/apostas/use-settlement";
import { lucroSugerido, tally } from "@/lib/settlement-view";
import { formatInt, formatMoney, formatOdd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProposalPanel, SuggestionDetail } from "@/components/conferir/SuggestionDetail";
import { LiquidarNaMao } from "@/components/conferir/LiquidarNaMao";
import { SelecionarTodas, SelectionBar, useSelecao } from "@/components/conferir/selection";
import { SelectToggleButton } from "@/components/ui/select-toggle-button";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useMediaQuery } from "@/hooks/use-media-query";
import { tintStyle, usePerformanceColor } from "@/hooks/use-performance-color";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";

type Aba = "bot" | "mao";
type Filtro = "todas" | "ganhou" | "perdeu" | "anulada";

const FILTROS: { value: Exclude<Filtro, "todas">; label: string; resultId: ResultIdEnum; sign: number }[] = [
  { value: "ganhou", label: "Ganhou", resultId: ResultIdEnum.WON, sign: 1 },
  { value: "perdeu", label: "Perdeu", resultId: ResultIdEnum.LOST, sign: -1 },
  { value: "anulada", label: "Anulada", resultId: ResultIdEnum.CANCELED, sign: 0 },
];
const doFiltro = (f: Filtro, s: SettlementSuggestion) =>
  f === "todas" || FILTROS.find((o) => o.value === f)?.resultId === s.suggestedResultId;

// A partir daqui o detalhe mora ao lado da lista; abaixo, abre por cima.
const PAINEL_QUERY = "(min-width: 1280px)";

/** ✓ / ✕ / – no círculo tingido: o veredito de relance, antes do valor. */
function StatusIcon({ resultId }: { resultId: ResultIdEnum }) {
  const color = usePerformanceColor();
  const sign = resultId === ResultIdEnum.WON ? 1 : resultId === ResultIdEnum.LOST ? -1 : 0;
  const Icone = sign > 0 ? Check : sign < 0 ? X : Minus;
  return (
    <span
      className={cn("grid size-7 shrink-0 place-items-center rounded-full", !sign && "bg-foreground/[0.06] text-zinc-500")}
      style={sign ? { color: color(sign), background: `color-mix(in srgb, ${color(sign)} 14%, transparent)` } : undefined}
    >
      <Icone size={13} weight="bold" />
    </span>
  );
}

/** "+R$ 102,00"; na anulada, "R$ 0,00" — devolver a stake não move o lucro. */
function Impacto({ suggestion: s, className }: { suggestion: SettlementSuggestion; className?: string }) {
  const color = usePerformanceColor();
  const lucro = lucroSugerido(s);
  if (s.suggestedResultId === ResultIdEnum.CANCELED) {
    return <span className={cn("font-semibold text-zinc-300", className)}>{formatMoney(0)}</span>;
  }
  return (
    <span className={cn("font-semibold", className)} style={{ color: color(lucro) }}>
      {lucro > 0 ? "+" : ""}
      {formatMoney(lucro)}
    </span>
  );
}

const placarDe = (s: SettlementSuggestion) =>
  s.homeScore != null && s.awayScore != null ? `${s.homeScore}×${s.awayScore}` : "—";
const apostaDe = (s: SettlementSuggestion) => `${formatMoney(s.stake, { cents: "auto" })} @ ${formatOdd(s.odd)}`;
const anulada = (s: SettlementSuggestion) => s.suggestedResultId === ResultIdEnum.CANCELED;

function PlacarChip({ s, className }: { s: SettlementSuggestion; className?: string }) {
  return (
    <span className={cn("rounded-md border border-foreground/15 px-1.5 py-px font-mono text-[12.5px] font-semibold tabular-nums text-foreground", className)}>
      {placarDe(s)}
    </span>
  );
}

function SuggestionRow({
  suggestion: s,
  selecting,
  checked,
  ativa,
  onTap,
}: {
  suggestion: SettlementSuggestion;
  selecting: boolean;
  checked: boolean;
  /** A que está aberta no painel ao lado. */
  ativa: boolean;
  /** Fora da seleção abre o detalhe; dentro, marca/desmarca. */
  onTap: () => void;
}) {
  return (
    <li
      role="button"
      tabIndex={0}
      data-bet={s.betId}
      onClick={onTap}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onTap())}
      aria-pressed={selecting ? checked : undefined}
      aria-current={ativa || undefined}
      className={cn(
        "relative cursor-pointer border-t border-foreground/[0.06] transition-colors first:border-t-0",
        checked ? "bg-accent/[0.08]" : ativa ? "bg-foreground/[0.04]" : "hover:bg-foreground/[0.025]",
        ativa && "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent",
      )}
    >
      {/* Mobile: veredito e valor nas pontas; embaixo do jogo, placar e aposta. */}
      <div className="flex items-start gap-3 px-4 py-3.5 md:hidden">
        {selecting ? <SelectCheck checked={checked} className="mt-1" /> : <StatusIcon resultId={s.suggestedResultId} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-foreground">{s.game}</p>
            <Impacto suggestion={s} className="whitespace-nowrap text-[14.5px] tabular-nums" />
          </div>
          <p className="truncate text-[13px] text-zinc-400">{s.market}</p>
          <p className="mt-1.5 flex items-center gap-2 text-[13px] tabular-nums text-zinc-500">
            <PlacarChip s={s} />
            {apostaDe(s)}
            {anulada(s) && " · devolvido"}
          </p>
        </div>
      </div>

      {/* Desktop: colunas alinhadas, dá pra varrer o lote sem ler cada linha. */}
      <div className="hidden h-[68px] grid-cols-[28px_minmax(0,1fr)_88px_150px_130px] items-center gap-4 px-5 md:grid">
        {selecting ? <SelectCheck checked={checked} className="justify-self-center" /> : <StatusIcon resultId={s.suggestedResultId} />}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{s.game}</p>
          <p className="truncate text-[12.5px] text-zinc-500">{s.market}</p>
        </div>
        <PlacarChip s={s} className="justify-self-end" />
        <span className="text-right text-[13px] tabular-nums text-zinc-500">{apostaDe(s)}</span>
        <span className="text-right tabular-nums">
          <Impacto suggestion={s} className="block text-sm" />
          {anulada(s) && (
            <span className="block text-[11.5px] text-zinc-500">devolve {formatMoney(s.stake, { cents: "auto" })}</span>
          )}
        </span>
      </div>
    </li>
  );
}

/** Abas: segmentado no celular, sublinhado no desktop. "Na mão" conta em âmbar — é ação sua. */
function Abas({ aba, onChange, bot, mao }: { aba: Aba; onChange: (a: Aba) => void; bot: number; mao: number }) {
  const abas = [
    { value: "bot" as const, curto: "Propostas", longo: "Propostas do bot", n: bot },
    { value: "mao" as const, curto: "Na mão", longo: "Liquidar na mão", n: mao },
  ];
  const badge = (value: Aba, n: number) => (
    <span
      className={cn(
        "rounded-full px-1.5 py-px text-[11.5px] font-semibold tabular-nums",
        value === "mao" && n ? "bg-warning/15 text-warning" : "bg-foreground/[0.08] text-zinc-400",
      )}
    >
      {formatInt(n)}
    </span>
  );
  return (
    <div role="tablist" aria-label="Conferência">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-foreground/10 p-1 md:hidden">
        {abas.map((a) => (
          <button
            key={a.value}
            type="button"
            role="tab"
            aria-selected={aba === a.value}
            onClick={() => onChange(a.value)}
            className={cn(
              "press flex h-10 items-center justify-center gap-2 rounded-lg text-[14.5px] font-semibold transition-colors",
              aba === a.value ? "bg-foreground/[0.08] text-foreground" : "text-zinc-400",
            )}
          >
            {a.curto} {badge(a.value, a.n)}
          </button>
        ))}
      </div>
      <div className="hidden gap-7 border-b border-foreground/[0.08] md:flex">
        {abas.map((a) => (
          <button
            key={a.value}
            type="button"
            role="tab"
            aria-selected={aba === a.value}
            onClick={() => onChange(a.value)}
            className={cn(
              "-mb-px flex h-11 items-center gap-2 border-b-2 text-sm font-medium transition-colors",
              aba === a.value ? "border-accent text-foreground" : "border-transparent text-zinc-400 hover:text-foreground",
            )}
          >
            {a.longo} {badge(a.value, a.n)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, label, count, dot, onClick }: { active: boolean; label: string; count: number; dot?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "press relative flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors",
        "after:absolute after:inset-x-0 after:-inset-y-1",
        active ? "border-foreground/15 bg-foreground/[0.09] text-foreground" : "border-foreground/10 text-zinc-300 hover:text-foreground",
      )}
    >
      {dot && <span className="size-1.5 rounded-full" style={{ background: dot }} />}
      {label}
      <span className="tabular-nums text-zinc-500">{formatInt(count)}</span>
    </button>
  );
}

/** Primeira carga: dizer quantas estão sendo lidas evita a sensação de travado. */
function LendoPlacares({ fila }: { fila: SettlementQueue | undefined }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-base font-medium text-foreground">Lendo os placares</p>
        <p className="text-xs text-zinc-500">
          {fila?.settleable
            ? `${fila.settleable} de ${fila.pending} apostas pendentes · pode levar alguns segundos`
            : "pode levar alguns segundos"}
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
        </div>
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

// Estado, não ação: baixo e sem fundo de card.
function Vazio({ buscando, titulo, texto }: { buscando: boolean; titulo: string; texto: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-foreground/[0.07] px-4 py-5 md:px-5" aria-live="polite">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-zinc-400">
        {buscando ? <CircleNotch size={16} className="animate-spin" /> : <Check size={16} weight="bold" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-semibold text-foreground">{buscando ? "Buscando resultados…" : titulo}</span>
        <span className="block text-[12.5px] text-zinc-500">
          {buscando ? "Lendo os placares dos jogos que já terminaram." : texto}
        </span>
      </span>
    </div>
  );
}

export default function ConferirPage() {
  const { data: suggestions, isLoading } = useSettlementSuggestions();
  const { data: fila } = useSettlementQueue();
  const { data: review } = useSettlementReview(true);
  const { compute, confirm, dismiss, settleManual } = useSettlementActions();
  const color = usePerformanceColor();
  const painel = useMediaQuery(PAINEL_QUERY);

  const [params, setParams] = useSearchParams();
  const aba: Aba = params.get("aba") === "mao" ? "mao" : "bot";
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [abertaId, setAbertaId] = useState<number | null>(null);
  // Confirmadas que ainda não saíram da lista: somem na hora, sem esperar o
  // refetch, e voltam se a API recusar.
  const [saindo, setSaindo] = useState<Set<number>>(new Set());

  // A fila (a mesma do número no menu) já está em cache quando se chega aqui.
  // Se ela diz que não há proposta, não tem o que esperar.
  const carregando = isLoading && !(fila && fila.suggestions === 0);

  const lista = useMemo(() => (suggestions ?? []).filter((s) => !saindo.has(s.betId)), [suggestions, saindo]);
  const naMao = useMemo(() => review ?? [], [review]);
  const nMao = review?.length ?? fila?.undecided ?? 0;
  const conta = tally(lista);
  const contaDe = { ganhou: conta.ganhas, perdeu: conta.perdidas, anulada: conta.anuladas };
  // Filtro que ficou vazio (confirmou a última anulada) volta pra "Todas".
  const filtroAtivo: Filtro = filtro !== "todas" && !contaDe[filtro] ? "todas" : filtro;
  const filtrada = useMemo(() => lista.filter((s) => doFiltro(filtroAtivo, s)), [lista, filtroAtivo]);
  const totalLucro = lista.reduce((t, s) => t + lucroSugerido(s), 0);
  const ganhas = lista.filter((s) => s.suggestedResultId === ResultIdEnum.WON).map((s) => s.betId);

  // Some do `saindo` o que a API já tirou da lista.
  useEffect(() => {
    const vivos = new Set((suggestions ?? []).map((s) => s.betId));
    setSaindo((prev) => {
      const next = new Set([...prev].filter((id) => vivos.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [suggestions]);

  const idsDaAba = aba === "bot" ? filtrada.map((s) => s.betId) : naMao.map((b) => b.betId);
  const sel = useSelecao(idsDaAba);
  const n = sel.selected.size;

  // Com o painel ao lado sempre há uma aberta (a primeira, se nenhuma foi
  // escolhida); sem ele, só a que foi tocada.
  const idx = filtrada.findIndex((s) => s.betId === abertaId);
  const posicao = idx >= 0 ? idx : painel && filtrada.length ? 0 : -1;
  const aberta = posicao >= 0 ? filtrada[posicao] : null;

  const trocarAba = (a: Aba) => {
    sel.sair();
    setParams(a === "mao" ? { aba: "mao" } : {}, { replace: true });
  };

  const ocupado = confirm.isPending || compute.isPending;
  const pull = usePullToRefresh(
    () => compute.mutateAsync().catch(() => undefined),
    !aberta && !ocupado && !sel.selecting && aba === "bot",
  );

  const confirmar = (betIds: number[]) => {
    setSaindo((prev) => new Set([...prev, ...betIds]));
    confirm.mutate(betIds, {
      onError: () =>
        setSaindo((prev) => new Set([...prev].filter((id) => !betIds.includes(id)))),
    });
    sel.sair();
  };
  const recusar = (betIds: number[], title?: string) => {
    dismiss(betIds, title);
    sel.sair();
  };
  // Resolver a aberta já abre a próxima ("Ao confirmar, abre a próxima proposta").
  const resolverAberta = (acao: (s: SettlementSuggestion) => void) => {
    if (!aberta) return;
    const prox = filtrada[posicao + 1] ?? filtrada[posicao - 1] ?? null;
    acao(aberta);
    setAbertaId(prox?.betId ?? null);
  };
  const mover = (delta: number) => {
    const alvo = filtrada[posicao + delta];
    if (alvo) setAbertaId(alvo.betId);
  };

  // ↑ ↓ andam pela lista com o painel aberto ao lado.
  useEffect(() => {
    if (!painel || aba !== "bot" || sel.selecting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      const alvo = filtrada[posicao + (e.key === "ArrowDown" ? 1 : -1)];
      if (!alvo) return;
      e.preventDefault();
      setAbertaId(alvo.betId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [painel, aba, sel.selecting, filtrada, posicao]);

  useEffect(() => {
    if (!painel || !aberta) return;
    document.querySelector(`[data-bet="${aberta.betId}"]`)?.scrollIntoView({ block: "nearest" });
  }, [painel, aberta]);

  const plural = lista.length === 1 ? "" : "s";
  const listaDaAba = aba === "bot" ? filtrada.length : naMao.length;
  const selectButton = listaDaAba > 0 && (
    <SelectToggleButton selecting={sel.selecting} onToggle={() => (sel.selecting ? sel.sair() : sel.ligar())} />
  );
  const confirmarGanhasLabel = ganhas.length === 1 ? "Confirmar a ganha" : `Confirmar as ${formatInt(ganhas.length)} ganhas`;
  const mostrarGanhas = aba === "bot" && ganhas.length > 0 && !sel.selecting;

  const detalhe = aberta && {
    suggestion: aberta,
    posicao: posicao + 1,
    total: filtrada.length,
    onPrev: posicao > 0 ? () => mover(-1) : undefined,
    onNext: posicao < filtrada.length - 1 ? () => mover(1) : undefined,
    busy: ocupado,
    onConfirm: () => resolverAberta((s) => confirmar([s.betId])),
    onReject: () => resolverAberta((s) => recusar([s.betId], `${s.game} · proposta recusada`)),
  };

  return (
    <MainLayout
      title="Conferência"
      subtitle={
        lista.length
          ? `${formatInt(lista.length)} proposta${plural} do bot · nada vira saldo até você confirmar`
          : "Nenhuma proposta neste lote"
      }
      actions={
        aba === "bot" &&
        lista.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-zinc-500">Se confirmar tudo</p>
            <p className="text-xl font-semibold tabular-nums" style={{ color: color(totalLucro) }}>
              {totalLucro > 0 ? "+" : ""}
              {formatMoney(totalLucro)}
            </p>
          </div>
        )
      }
      hideBottomNav={sel.selecting}
      mobileHeader={
        <PageHeader
          title="Conferência"
          subtitle={lista.length ? `${formatInt(lista.length)} proposta${plural} · nada vira saldo antes` : "Nenhuma proposta"}
          actions={selectButton}
        />
      }
    >
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />
      {!painel && detalhe && <SuggestionDetail {...detalhe} onClose={() => setAbertaId(null)} />}

      <div className={cn("space-y-4 md:space-y-5", sel.selecting ? "pb-44 md:pb-28" : mostrarGanhas ? "pb-20 md:pb-6" : "pb-6")}>
        <Abas aba={aba} onChange={trocarAba} bot={lista.length} mao={nMao} />

        {aba === "bot" ? (
          carregando ? (
            <LendoPlacares fila={fila} />
          ) : lista.length === 0 ? (
            <Vazio buscando={compute.isPending} titulo="Nada pra confirmar" texto="O bot não tem propostas automáticas neste lote." />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="-mx-4 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
                  <Chip active={filtroAtivo === "todas"} label="Todas" count={lista.length} onClick={() => setFiltro("todas")} />
                  {FILTROS.filter((f) => contaDe[f.value]).map((f) => (
                    <Chip
                      key={f.value}
                      active={filtroAtivo === f.value}
                      label={f.label}
                      count={contaDe[f.value]}
                      dot={f.sign ? color(f.sign) : "rgb(113 113 122)"}
                      onClick={() => setFiltro(f.value)}
                    />
                  ))}
                </div>
                <div className="hidden shrink-0 items-center gap-2 md:flex">
                  <Button variant="secondary" size="sm" onClick={() => (sel.selecting ? sel.sair() : sel.ligar())}>
                    <ListChecks /> {sel.selecting ? "Cancelar" : "Selecionar"}
                  </Button>
                  {mostrarGanhas && (
                    <Button variant="secondary" size="sm" disabled={ocupado} onClick={() => confirmar(ganhas)}>
                      <Checks style={{ color: color(1) }} /> {confirmarGanhasLabel}
                    </Button>
                  )}
                </div>
              </div>

              {sel.selecting && <SelecionarTodas sel={sel} total={filtrada.length} />}

              <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start xl:gap-5">
                <ul className="-mx-4 border-y border-foreground/[0.07] md:mx-0 md:overflow-hidden md:rounded-2xl md:border md:border-foreground/10 md:bg-card md:shadow-card">
                  {filtrada.map((s) => (
                    <SuggestionRow
                      key={s.betId}
                      suggestion={s}
                      selecting={sel.selecting}
                      checked={sel.selected.has(s.betId)}
                      ativa={painel && !sel.selecting && aberta?.betId === s.betId}
                      onTap={() => (sel.selecting ? sel.toggle(s.betId) : setAbertaId(s.betId))}
                    />
                  ))}
                </ul>
                {painel && detalhe && (
                  <ProposalPanel {...detalhe} className="sticky top-[100px] hidden max-h-[calc(100dvh-120px)] xl:flex" />
                )}
              </div>
            </>
          )
        ) : naMao.length === 0 ? (
          <Vazio buscando={false} titulo="Tudo liquidado" texto="Nenhuma aposta esperando você." />
        ) : (
          <>
            {sel.selecting && <SelecionarTodas sel={sel} total={naMao.length} />}
            <LiquidarNaMao lista={naMao} sel={sel} />
          </>
        )}
      </div>

      {/* Atalho do lote no celular: flutua acima da bottom nav. */}
      {mostrarGanhas && (
        <div className="fixed inset-x-3 z-30 md:hidden" style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => confirmar(ganhas)}
            className="press flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-foreground/10 bg-zinc-900/95 text-[15px] font-semibold text-foreground backdrop-blur-md disabled:opacity-60"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            <Checks size={18} weight="bold" style={{ color: color(1) }} />
            {confirmarGanhasLabel}
          </button>
        </div>
      )}

      {sel.selecting && aba === "bot" && (
        <SelectionBar label={`${n} de ${filtrada.length} selecionadas`}>
          <div className="grid grid-cols-[0.8fr_1.4fr] gap-2 md:flex">
            <Button
              variant="secondary"
              disabled={!n}
              onClick={() => recusar(sel.ids)}
              className="h-12 gap-1.5 rounded-xl border-danger/40 text-danger hover:bg-danger/10 md:h-11 md:px-4"
            >
              <X size={15} weight="bold" /> Recusar
            </Button>
            <Button disabled={!n || ocupado} onClick={() => confirmar(sel.ids)} className="h-12 gap-2 rounded-xl text-[14.5px] font-semibold md:h-11 md:px-6">
              <Check size={16} weight="bold" /> {n ? `Confirmar ${n}` : "Confirmar"}
            </Button>
          </div>
        </SelectionBar>
      )}

      {sel.selecting && aba === "mao" && (
        <SelectionBar label={`${n} de ${naMao.length} selecionadas`}>
          <div className="grid grid-cols-3 gap-2 md:flex">
            {FILTROS.map((o) => (
              <Button
                key={o.resultId}
                variant="secondary"
                disabled={!n || settleManual.isPending}
                onClick={() => {
                  settleManual.mutate({ betIds: sel.ids, resultId: o.resultId });
                  sel.sair();
                }}
                className={cn("h-12 rounded-xl font-semibold md:h-11 md:px-4", !o.sign && "bg-foreground/[0.05] text-zinc-200")}
                style={o.sign ? tintStyle(color(o.sign)) : undefined}
              >
                <span className="md:hidden">{o.label}</span>
                <span className="hidden md:inline">Marcar {o.label.toLowerCase()}</span>
              </Button>
            ))}
          </div>
        </SelectionBar>
      )}
    </MainLayout>
  );
}
