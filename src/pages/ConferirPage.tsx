import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { nextSelection } from "@/lib/settlement-selection";
import {
  diaRelativo,
  formatTally,
  lucroSugerido,
  tally,
} from "@/lib/settlement-view";
import { formatTime } from "@/lib/format";
import { stakeCurta } from "@/lib/settlement-format";
import { cn } from "@/lib/utils";
import { SuggestionDetail } from "@/components/conferir/SuggestionDetail";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import {
  ArrowsClockwise,
  CaretRight,
  HandPointing,
  CheckCircle,
  CheckSquare,
  Info,
  X,
  XCircle,
} from "@phosphor-icons/react";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function corDoLucro(lucro: number): string {
  return lucro > 0 ? "text-green-400" : lucro < 0 ? "text-red-400" : "text-zinc-300";
}

const BADGES: Record<number, { label: string; cls: string }> = {
  [ResultIdEnum.WON]: {
    label: "GANHOU",
    cls: "bg-green-500/[0.12] border-green-500/25 text-green-400",
  },
  [ResultIdEnum.LOST]: {
    label: "PERDEU",
    cls: "bg-red-500/[0.12] border-red-500/25 text-red-400",
  },
  [ResultIdEnum.CANCELED]: {
    label: "ANULADA",
    cls: "bg-white/[0.06] border-white/10 text-zinc-300",
  },
};

function ResultBadge({ resultId }: { resultId: ResultIdEnum }) {
  const it = BADGES[resultId] ?? BADGES[ResultIdEnum.CANCELED];
  return (
    <span
      className={cn(
        "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        it.cls,
      )}
    >
      {it.label}
    </span>
  );
}

/** "+R$ 102,00" ou, na anulada, "R$ 150,00 devolvidos" — devolver não é lucro zero. */
function Impacto({
  suggestion,
  className,
}: {
  suggestion: SettlementSuggestion;
  className?: string;
}) {
  if (suggestion.suggestedResultId === ResultIdEnum.CANCELED) {
    return (
      <span className={cn("text-zinc-400", className)}>
        {BRL.format(suggestion.stake)} devolvidos
      </span>
    );
  }
  const lucro = lucroSugerido(suggestion);
  return (
    <span className={cn("font-medium", corDoLucro(lucro), className)}>
      {lucro > 0 ? "+" : ""}
      {BRL.format(lucro)}
    </span>
  );
}

interface RowProps {
  suggestion: SettlementSuggestion;
  checked: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  onOpen: () => void;
  busy: boolean;
}

function SuggestionRow({ suggestion, checked, onToggle, onDismiss, onOpen, busy }: RowProps) {
  const placar =
    suggestion.homeScore != null && suggestion.awayScore != null
      ? `${suggestion.homeScore}x${suggestion.awayScore}`
      : "—";
  const quando = suggestion.eventStartAt
    ? { dia: diaRelativo(suggestion.eventStartAt), hora: formatTime(suggestion.eventStartAt) }
    : null;
  const marcar = `${checked ? "Desmarcar" : "Marcar"} ${suggestion.game}`;
  const descartar = (
    <button
      type="button"
      onClick={onDismiss}
      disabled={busy}
      aria-label={`Descartar a proposta de ${suggestion.game}`}
      className="shrink-0 rounded-md p-1 text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-zinc-300 disabled:opacity-40"
    >
      <X size={14} />
    </button>
  );

  return (
    <li
      className={cn(
        "border-b border-white/[0.06] transition-colors last:border-b-0",
        checked ? "bg-white/[0.035]" : "hover:bg-white/[0.02]",
      )}
    >
      {/* Mobile: cartão empilhado. A explicação ganha caixa própria porque é o
          que decide se o usuário aceita ou não — não é detalhe de rodapé. */}
      <div className="p-3 md:hidden">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={checked}
            onCheckedChange={onToggle}
            className="mt-0.5 shrink-0"
            aria-label={marcar}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <button type="button" onClick={onOpen} className="block w-full space-y-2 text-left">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-xs text-zinc-500">
                {quando && `${quando.dia} ${quando.hora} · `}
                {suggestion.market}
              </p>
              <ResultBadge resultId={suggestion.suggestedResultId} />
            </div>

            <p className="truncate text-sm font-medium text-white">{suggestion.game}</p>

            <p className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-400">
              <span className="mr-1.5 font-semibold text-zinc-200">{placar}</span>
              {suggestion.explanation}
            </p>
            </button>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">
                {stakeCurta(suggestion.stake)} @ {suggestion.odd.toFixed(2)}{" "}
                <Impacto suggestion={suggestion} className="ml-1 text-xs" />
              </p>
              {descartar}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: uma linha por proposta, colunas alinhadas — dá pra varrer o
          lote de cima a baixo sem ler cada cartão. */}
      <div className="hidden items-center gap-3 px-4 py-2.5 text-sm md:grid md:grid-cols-[auto_58px_minmax(140px,1.05fr)_auto_minmax(150px,1.5fr)_auto_auto_88px_auto]">
        <Checkbox checked={checked} onCheckedChange={onToggle} aria-label={marcar} />

        <div className="text-xs leading-tight text-zinc-500">
          {quando ? (
            <>
              <div>{quando.dia}</div>
              <div>{quando.hora}</div>
            </>
          ) : (
            <span className="text-zinc-600">—</span>
          )}
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => e.key === "Enter" && onOpen()}
          className="min-w-0 cursor-pointer md:col-span-3 md:grid md:grid-cols-subgrid md:items-center"
        >
        <div className="min-w-0">
          <p className="truncate font-medium text-white hover:underline">{suggestion.game}</p>
          <p className="truncate text-xs text-zinc-500">{suggestion.market}</p>
        </div>

        <span className="font-semibold text-zinc-200">{placar}</span>

        <p className="truncate text-xs text-zinc-400" >
          {suggestion.explanation}
        </p>
        </div>

        <span className="whitespace-nowrap text-xs text-zinc-500">
          {stakeCurta(suggestion.stake)} @ {suggestion.odd.toFixed(2)}
        </span>

        <Impacto suggestion={suggestion} className="whitespace-nowrap text-right text-xs" />

        <div className="flex justify-end">
          <ResultBadge resultId={suggestion.suggestedResultId} />
        </div>

        {descartar}
      </div>
    </li>
  );
}

/**
 * O que a fila deixou de fora. As duas coisas eram silêncio: aposta com jogo
 * encerrado que o bot não soube resolver ficava invisível, e lote cheio dava a
 * impressão de que não havia mais nada esperando.
 */
function FilaNotes({
  fila,
  busy,
  onCompute,
}: {
  fila: SettlementQueue | undefined;
  busy: boolean;
  onCompute: () => void;
}) {
  if (!fila || (!fila.hasMore && !fila.undecided)) return null;
  const n = fila.undecided;

  return (
    <div className="flex flex-col gap-2 border-b border-white/[0.06] px-4 py-2.5 text-xs md:flex-row md:items-center md:justify-between">
      {fila.hasMore ? (
        <p className="flex items-start gap-2 text-zinc-400">
          <Info size={14} className="mt-px shrink-0 text-zinc-500" />
          Ainda há apostas na fila que não entraram neste lote.
          <button
            type="button"
            onClick={onCompute}
            disabled={busy}
            className="shrink-0 text-accent underline-offset-4 hover:underline disabled:opacity-50 md:hidden"
          >
            Calcular
          </button>
        </p>
      ) : (
        <span />
      )}
      {!!n && (
        <p className="text-zinc-500">
          {n} sem proposta — lista abaixo.
        </p>
      )}
    </div>
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
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-zinc-300">
        <HandPointing size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">
          {n} espera{n === 1 ? "" : "m"} você
        </span>
        <span className="block text-xs text-zinc-500">Liquidar na mão em Apostas</span>
      </span>
      <CaretRight size={16} className="shrink-0 text-zinc-500" />
    </Link>
  );
}

/** Enquanto o compute roda: dizer quantas estão sendo lidas evita a sensação de travado. */
function LendoPlacares({ fila }: { fila: SettlementQueue | undefined }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-base font-medium text-white">Lendo os placares</p>
        <p className="text-xs text-zinc-500">
          {fila?.settleable
            ? `${fila.settleable} de ${fila.pending} apostas pendentes · pode levar alguns segundos`
            : "pode levar alguns segundos"}
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
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

function Vazio({
  fila,
  busy,
  buscando,
  onCompute,
}: {
  fila: SettlementQueue | undefined;
  busy: boolean;
  /** Busca em andamento: o card fica, só troca o ícone e a frase. */
  buscando: boolean;
  onCompute: () => void;
}) {
  return (
    // A tela vazia ocupa a altura toda e empurra o cartao das pendentes pro
    // rodape: ali ele e' a unica saida, em vez de mais um bloco na pilha.
    <div className="flex min-h-[calc(100svh-13rem)] flex-col gap-3 md:min-h-[calc(100vh-11rem)]">
      {fila?.hasMore && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[11px] font-semibold tracking-wide text-zinc-500">
            FILA RESTANTE
          </p>
          <p className="mt-1.5 text-sm text-zinc-400">
            Ainda há apostas na fila que não entraram neste lote.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onCompute}
            disabled={busy}
            className="mt-3 w-full gap-2"
          >
            <ArrowsClockwise size={16} className={busy ? "animate-spin" : undefined} />
            Calcular próximo lote
          </Button>
        </div>
      )}

      <div className="grid flex-1 place-items-center rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <div>
          {buscando ? (
            <ArrowsClockwise size={32} className="mx-auto mb-3 animate-spin text-zinc-500" />
          ) : (
            <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-white/[0.04] text-zinc-500">
              <CheckCircle size={26} />
            </span>
          )}
          <p className="text-lg font-semibold text-white" aria-live="polite">
            {buscando ? "Buscando resultados…" : "Nenhuma proposta nova"}
          </p>
          <p className="mx-auto mt-1 max-w-[320px] text-sm text-zinc-500">
            {buscando
              ? "Lendo os placares dos jogos que já terminaram."
              : "O bot já passou por todas as apostas deste lote."}
          </p>
        </div>
      </div>

      <SemProposta enabled={!!fila?.undecided} />
    </div>
  );
}

export default function ConferirPage() {
  const { data: suggestions, isLoading } = useSettlementSuggestions();
  const { data: fila } = useSettlementQueue();
  const { compute, confirm, dismiss } = useSettlementActions();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [aberta, setAberta] = useState<SettlementSuggestion | null>(null);

  const lista = useMemo(() => suggestions ?? [], [suggestions]);

  // betIds que a tela já mostrou. Sem isso, todo refetch remarcava a lista
  // inteira e desfazia o que o usuário tinha desmarcado de propósito. Ver
  // nextSelection.
  const conhecidas = useRef<ReadonlySet<number>>(new Set());

  useEffect(() => {
    const betIds = lista.map((s) => s.betId);
    setSelected((previous) =>
      nextSelection({ betIds, previous, known: conhecidas.current }),
    );
    conhecidas.current = new Set(betIds);
  }, [lista]);

  const toggle = (betId: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(betId)) next.delete(betId);
      else next.add(betId);
      return next;
    });

  const ids = [...selected];
  const marcadas = lista.filter((s) => selected.has(s.betId));
  const total = marcadas.reduce((sum, s) => sum + lucroSugerido(s), 0);
  const ocupado = confirm.isPending || dismiss.isPending || compute.isPending;
  // Puxar a lista no celular busca resultados novos, igual ao botão "Calcular
  // próximo lote" do desktop. Desligado com o detalhe aberto: o gesto ali é
  // rolar o sheet. O erro já vira toast no onError da mutation.
  const pull = usePullToRefresh(
    () => compute.mutateAsync().catch(() => undefined),
    !aberta && !ocupado,
  );
  const todasMarcadas = lista.length > 0 && selected.size === lista.length;
  const resumoLote = formatTally(tally(lista));
  const resumoSelecao = formatTally(tally(marcadas), ", ");

  return (
    <MainLayout
      title="Conferência de liquidação"
      subtitle={
        lista.length
          ? `${lista.length} proposta${lista.length === 1 ? "" : "s"} do bot · nada vira lucro até você confirmar`
          : "Nada aguardando conferência"
      }
      titleWrapperClassName="flex items-baseline gap-2.5 min-w-0"
      titleClassName="text-2xl font-semibold tracking-tight shrink-0"
      subtitleClassName="text-sm text-zinc-500 truncate"
      mobileHeader={
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight">Conferência</h1>
          <span className="text-sm text-zinc-500">{lista.length || ""}</span>
        </div>
      }
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => compute.mutate()}
          disabled={ocupado}
          className="hidden shrink-0 gap-2 md:inline-flex"
        >
          <ArrowsClockwise
            size={16}
            className={compute.isPending ? "animate-spin" : undefined}
          />
          Calcular próximo lote
        </Button>
      }
    >
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />
      <SuggestionDetail
        suggestion={aberta}
        checked={!!aberta && selected.has(aberta.betId)}
        busy={ocupado}
        onClose={() => setAberta(null)}
        onToggle={() => aberta && toggle(aberta.betId)}
        onDismiss={() => aberta && dismiss.mutate([aberta.betId])}
      />
      <div className="pb-32 md:pb-6">
        {/* Carregamento de tela cheia só na primeira carga. Numa nova busca
            (botão ou puxar) o conteúdo fica: trocar tudo por skeleton e voltar
            pro mesmo vazio parecia a tela quebrando. */}
        {isLoading ? (
          <LendoPlacares fila={fila} />
        ) : lista.length === 0 ? (
          <Vazio
            fila={fila}
            busy={ocupado}
            buscando={compute.isPending}
            onCompute={() => compute.mutate()}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">
            <FilaNotes fila={fila} busy={ocupado} onCompute={() => compute.mutate()} />

            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <Checkbox
                  checked={todasMarcadas}
                  onCheckedChange={() =>
                    setSelected(
                      todasMarcadas ? new Set() : new Set(lista.map((s) => s.betId)),
                    )
                  }
                  aria-label={todasMarcadas ? "Desmarcar todas" : "Selecionar todas"}
                />
                <span className="truncate text-sm font-medium text-white">
                  {selected.size} de {lista.length} selecionada
                  {selected.size === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelected(
                      todasMarcadas ? new Set() : new Set(lista.map((s) => s.betId)),
                    )
                  }
                  className="shrink-0 text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
                >
                  {todasMarcadas ? "Limpar" : "Selecionar todas"}
                </button>
              </div>
              <span className="hidden shrink-0 text-xs text-zinc-500 sm:inline">
                {resumoLote}
              </span>
            </div>

            <ul>
              {lista.map((s) => (
                <SuggestionRow
                  key={s.betId}
                  suggestion={s}
                  checked={selected.has(s.betId)}
                  onToggle={() => toggle(s.betId)}
                  onDismiss={() => dismiss.mutate([s.betId])}
                  onOpen={() => setAberta(s)}
                  busy={ocupado}
                />
              ))}
            </ul>

            {/* No mobile a barra flutua sobre a lista; no desktop ela é o rodapé
                do próprio card, no fim do lote que acabou de ser lido. */}
            <div
              role="toolbar"
              aria-label="Confirmar propostas"
              className={cn(
                "fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-50",
                "space-y-3 rounded-2xl border border-white/10 bg-zinc-900/95 p-3 backdrop-blur-md",
                "animate-in slide-in-from-bottom-4 duration-200",
                "md:static md:inset-auto md:flex md:items-center md:justify-between md:gap-4",
                "md:space-y-0 md:rounded-none md:border-0 md:border-t md:border-white/[0.06]",
                "md:bg-transparent md:px-4 md:py-3 md:backdrop-blur-none",
              )}
              style={{ boxShadow: "var(--shadow-lg)" }}
            >
              <div className="flex items-center justify-between gap-3 px-1 text-sm md:px-0">
                {selected.size ? (
                  <>
                    <span className="truncate text-zinc-400">
                      <span className="font-semibold text-white">
                        {selected.size} aposta{selected.size === 1 ? "" : "s"}
                      </span>
                      {resumoSelecao && `: ${resumoSelecao}`}
                    </span>
                    <span
                      className={cn("shrink-0 font-semibold", corDoLucro(total))}
                    >
                      {total > 0 ? "+" : ""}
                      {BRL.format(total)}
                      <span className="hidden font-normal text-zinc-500 md:inline">
                        {" "}
                        no lucro
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-500">
                    Marque o que você aceita para confirmar
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-2 md:flex md:shrink-0 md:items-center">
                <Button
                  variant="ghost"
                  onClick={() => dismiss.mutate(ids)}
                  disabled={ocupado || !selected.size}
                  aria-label="Descartar propostas selecionadas"
                  className="min-h-[48px] gap-2 px-4 text-zinc-300 md:min-h-0"
                >
                  <XCircle size={20} />
                  <span className="hidden md:inline">Descartar selecionadas</span>
                </Button>
                <Button
                  onClick={() => confirm.mutate(ids)}
                  disabled={ocupado || !selected.size}
                  className="min-h-[48px] gap-2 bg-accent text-base font-semibold text-white md:min-h-0 md:text-sm"
                >
                  <CheckSquare size={20} weight="fill" className="md:hidden" />
                  <CheckCircle size={16} className="hidden md:block" />
                  Confirmar {selected.size || ""}
                </Button>
              </div>
            </div>
          </div>
        )}
        {!isLoading && !!lista.length && (
          <div className="mt-4">
            <SemProposta enabled={!!fila?.undecided} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
