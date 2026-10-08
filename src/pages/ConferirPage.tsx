import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SelectCheck } from "@/components/ui/select-check";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultIdEnum } from "@/api/routes/get-bets";
import type {
  SettlementQueue,
  SettlementSuggestion,
} from "@/api/routes/get-settlement";
import {
  useSettlementActions,
  useSettlementQueue,
  useSettlementReview,
  useSettlementSuggestions,
} from "@/hooks/apostas/use-settlement";
import { lucroSugerido } from "@/lib/settlement-view";
import { formatInt, formatMoney, formatOdd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SuggestionDetail } from "@/components/conferir/SuggestionDetail";
import { SelectionBar } from "@/components/conferir/selection";
import { SelectToggleButton } from "@/components/ui/select-toggle-button";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { tintStyle, usePerformanceColor } from "@/hooks/use-performance-color";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { ArrowsClockwise, CaretRight, Check, HandPointing, X } from "@phosphor-icons/react";

// Sinal de cada resultado pra cor de Preferências (ganho/perda); anulada fica neutra.
const BADGES: Record<number, { label: string; sign: number }> = {
  [ResultIdEnum.WON]: { label: "GANHOU", sign: 1 },
  [ResultIdEnum.LOST]: { label: "PERDEU", sign: -1 },
  [ResultIdEnum.CANCELED]: { label: "ANULADA", sign: 0 },
};

function ResultBadge({ resultId }: { resultId: ResultIdEnum }) {
  const color = usePerformanceColor();
  const it = BADGES[resultId] ?? BADGES[ResultIdEnum.CANCELED];
  return (
    <span
      className={cn(
        "shrink-0 rounded-md border px-2 py-0.5 text-[10.5px] font-bold tracking-wide",
        !it.sign && "bg-foreground/[0.06] border-foreground/15 text-zinc-300",
      )}
      style={it.sign ? tintStyle(color(it.sign)) : undefined}
    >
      {it.label}
    </span>
  );
}

/** "+R$ 102,00" ou, na anulada, "R$ 150,00" devolvidos — devolver não é lucro zero. */
function Impacto({ suggestion, className }: { suggestion: SettlementSuggestion; className?: string }) {
  const color = usePerformanceColor();
  if (suggestion.suggestedResultId === ResultIdEnum.CANCELED) {
    return <span className={cn("font-semibold text-zinc-300", className)}>{formatMoney(suggestion.stake)}</span>;
  }
  const lucro = lucroSugerido(suggestion);
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

// Colunas do desktop. Com a seleção ligada entra a do checkbox na frente.
const DESKTOP_COLS = "md:grid-cols-[minmax(0,1.5fr)_110px_minmax(0,0.8fr)_140px_110px]";
const DESKTOP_COLS_SEL = "md:grid-cols-[40px_minmax(0,1.5fr)_110px_minmax(0,0.8fr)_140px_110px]";

function SuggestionRow({
  suggestion: s,
  selecting,
  checked,
  onTap,
}: {
  suggestion: SettlementSuggestion;
  selecting: boolean;
  checked: boolean;
  /** Fora da seleção abre o detalhe; dentro, marca/desmarca. */
  onTap: () => void;
}) {
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onTap())}
      aria-pressed={selecting ? checked : undefined}
      className={cn(
        "cursor-pointer border-t border-foreground/[0.06] transition-colors first:border-t-0",
        checked ? "bg-accent/[0.08]" : "hover:bg-foreground/[0.025]",
      )}
    >
      {/* Mobile: jogo e mercado em cima com o veredito; embaixo placar, aposta
          e o quanto mexe no lucro. A explicação mora no detalhe. */}
      <div className="flex items-start gap-3 px-4 py-3.5 md:hidden">
        {selecting && <SelectCheck checked={checked} className="mt-0.5" />}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-snug text-foreground">{s.game}</p>
              <p className="truncate text-[12.5px] text-zinc-400">{s.market}</p>
            </div>
            <ResultBadge resultId={s.suggestedResultId} />
          </div>
          <div className="flex items-center gap-2.5 tabular-nums">
            <span className="rounded-md bg-foreground/[0.06] px-2 py-0.5 text-[12.5px] font-semibold">{placarDe(s)}</span>
            <span className="text-[12.5px] text-zinc-500">{apostaDe(s)}</span>
            <Impacto suggestion={s} className="ml-auto whitespace-nowrap text-[13.5px]" />
          </div>
        </div>
      </div>

      {/* Desktop: colunas alinhadas, dá pra varrer o lote sem ler cada linha. */}
      <div className={cn("hidden h-16 items-center px-5 md:grid", selecting ? DESKTOP_COLS_SEL : DESKTOP_COLS)}>
        {selecting && <SelectCheck checked={checked} />}
        <div className="min-w-0 pr-5">
          <p className="truncate text-sm font-semibold text-foreground">{s.game}</p>
          <p className="truncate text-[12.5px] text-zinc-400">{s.market}</p>
        </div>
        <span className="text-sm font-semibold tabular-nums">{placarDe(s)}</span>
        <span className="text-right text-[13px] tabular-nums text-zinc-500">{apostaDe(s)}</span>
        <Impacto suggestion={s} className="text-right text-sm tabular-nums" />
        <span className="justify-self-end">
          <ResultBadge resultId={s.suggestedResultId} />
        </span>
      </div>
    </li>
  );
}

/** As que o bot não resolveu viram uma tela própria — aqui só a porta. */
function SemProposta({ enabled }: { enabled: boolean }) {
  const { data } = useSettlementReview(enabled);
  if (!enabled || !data?.length) return null;
  const n = data.length;

  return (
    <Link
      to="/settlement/review"
      className="flex items-center gap-3.5 rounded-2xl border border-foreground/10 bg-card p-3.5 transition-colors hover:bg-foreground/[0.04] md:px-4 md:py-4"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground/[0.06] text-zinc-300">
        <HandPointing size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold text-foreground">
          {n} espera{n === 1 ? "" : "m"} você
        </span>
        <span className="block text-[12.5px] text-zinc-500">O bot não resolveu · liquidar na mão</span>
      </span>
      <CaretRight size={14} className="shrink-0 text-zinc-500" />
    </Link>
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

function Vazio({ buscando }: { buscando: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-foreground/10 bg-card px-5 py-6 md:px-7" aria-live="polite">
      <p className="flex items-center gap-2 text-[17px] font-semibold text-foreground">
        {buscando && <ArrowsClockwise size={17} className="animate-spin text-zinc-500" />}
        {buscando ? "Buscando resultados…" : "Nada pra confirmar"}
      </p>
      <p className="text-[13px] text-zinc-500">
        {buscando ? "Lendo os placares dos jogos que já terminaram." : "O bot não tem mais propostas neste lote."}
      </p>
    </div>
  );
}

export default function ConferirPage() {
  const { data: suggestions, isLoading } = useSettlementSuggestions();
  const { data: fila } = useSettlementQueue();
  const { compute, confirm, dismiss } = useSettlementActions();
  // Seleção só quando pedida: a lista abre limpa e tocar abre o detalhe.
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [aberta, setAberta] = useState<SettlementSuggestion | null>(null);

  const lista = useMemo(() => suggestions ?? [], [suggestions]);

  // O que saiu da lista (confirmado, recusado, refetch) sai da seleção junto.
  useEffect(() => {
    setSelected((prev) => {
      const vivos = new Set(lista.map((s) => s.betId));
      const next = new Set([...prev].filter((id) => vivos.has(id)));
      return next.size === prev.size ? prev : next;
    });
    if (!lista.length) setSelecting(false);
  }, [lista]);

  const sairDaSelecao = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const toggle = (betId: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(betId)) next.delete(betId);
      else next.add(betId);
      return next;
    });

  const ids = [...selected];
  const n = ids.length;
  const todas = lista.length > 0 && n === lista.length;
  const ocupado = confirm.isPending || compute.isPending;
  // Puxar a lista no celular força o cálculo agora (ele já roda sozinho ao ler
  // a fila). Desligado com o detalhe aberto ou selecionando: ali o gesto é
  // rolar. O erro já vira toast no onError da mutation.
  const pull = usePullToRefresh(
    () => compute.mutateAsync().catch(() => undefined),
    !aberta && !ocupado && !selecting,
  );

  const confirmar = (betIds: number[]) => {
    confirm.mutate(betIds);
    sairDaSelecao();
    setAberta(null);
  };
  const recusar = (betIds: number[], title?: string) => {
    dismiss(betIds, title);
    sairDaSelecao();
    setAberta(null);
  };

  const plural = lista.length === 1 ? "" : "s";
  const selectButton = lista.length > 0 && (
    <SelectToggleButton selecting={selecting} onToggle={() => (selecting ? sairDaSelecao() : setSelecting(true))} />
  );

  return (
    <MainLayout
      title="Conferência de liquidação"
      subtitle={
        lista.length
          ? `${lista.length} proposta${plural} do bot · nada vira saldo até você confirmar`
          : "Nenhuma proposta neste lote"
      }
      actions={selectButton}
      hideBottomNav={selecting}
      mobileHeader={
        <PageHeader
          title="Conferência"
          subtitle={lista.length ? `${formatInt(lista.length)} proposta${plural} do bot` : "Nenhuma proposta"}
          actions={selectButton}
        />
      }
    >
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />
      <SuggestionDetail
        suggestion={aberta}
        busy={ocupado}
        onClose={() => setAberta(null)}
        onConfirm={() => aberta && confirmar([aberta.betId])}
        onReject={() => aberta && recusar([aberta.betId], `${aberta.game} · proposta recusada`)}
      />

      <div className={cn("space-y-3.5", selecting ? "pb-44 md:pb-28" : "pb-6")}>
        {isLoading ? (
          <LendoPlacares fila={fila} />
        ) : lista.length === 0 ? (
          <Vazio buscando={compute.isPending} />
        ) : (
          <>
            {/* Mobile: "selecionar todas" fica acima da lista; no desktop ele
                mora no cabeçalho da tabela. */}
            {selecting && (
              <label className="flex items-center gap-3 px-1 text-[13.5px] tabular-nums md:hidden">
                <button
                  type="button"
                  onClick={() => setSelected(todas ? new Set() : new Set(lista.map((s) => s.betId)))}
                  aria-label={todas ? "Desmarcar todas" : "Selecionar todas"}
                  className="press rounded-full"
                >
                  <SelectCheck checked={todas} indeterminate={!todas && n > 0} />
                </button>
                {n} de {lista.length} selecionadas
              </label>
            )}

            <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-card">
              <div
                className={cn(
                  "hidden h-11 items-center border-b border-foreground/[0.07] px-5 text-[11px] font-medium tracking-wider text-zinc-500 md:grid",
                  selecting ? DESKTOP_COLS_SEL : DESKTOP_COLS,
                )}
              >
                {selecting && (
                  <button
                    type="button"
                    onClick={() => setSelected(todas ? new Set() : new Set(lista.map((s) => s.betId)))}
                    aria-label={todas ? "Desmarcar todas" : "Selecionar todas"}
                    className="press rounded-full"
                  >
                    <SelectCheck checked={todas} indeterminate={!todas && n > 0} />
                  </button>
                )}
                <span>{selecting ? `${n} DE ${lista.length}` : "APOSTA"}</span>
                <span>PLACAR</span>
                <span className="text-right">STAKE @ ODD</span>
                <span className="text-right">RESULTADO</span>
                <span />
              </div>
              <ul>
                {lista.map((s) => (
                  <SuggestionRow
                    key={s.betId}
                    suggestion={s}
                    selecting={selecting}
                    checked={selected.has(s.betId)}
                    onTap={() => (selecting ? toggle(s.betId) : setAberta(s))}
                  />
                ))}
              </ul>
            </div>
          </>
        )}

        {!isLoading && !selecting && <SemProposta enabled={!!fila?.undecided} />}
      </div>

      {selecting && (
        <SelectionBar label={`${n} de ${lista.length} selecionadas`}>
          <div className="grid grid-cols-[0.8fr_1.4fr] gap-2 md:flex">
            <Button
              variant="secondary"
              disabled={!n}
              onClick={() => recusar(ids)}
              className="h-12 gap-1.5 rounded-xl border-danger/40 text-danger hover:bg-danger/10 md:h-11 md:px-4"
            >
              <X size={15} weight="bold" /> Recusar
            </Button>
            <Button disabled={!n || ocupado} onClick={() => confirmar(ids)} className="h-12 gap-2 rounded-xl text-[14.5px] font-semibold md:h-11 md:px-6">
              <Check size={16} weight="bold" /> {n ? `Confirmar ${n}` : "Confirmar"}
            </Button>
          </div>
        </SelectionBar>
      )}
    </MainLayout>
  );
}
