import { useEffect, useMemo, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultIdEnum } from "@/api/routes/get-bets";
import type {
  ComputeSummary,
  SettlementSuggestion,
} from "@/api/routes/get-settlement";
import {
  useSettlementActions,
  useSettlementSuggestions,
} from "@/hooks/apostas/use-settlement";
import { nextSelection } from "@/lib/settlement-selection";
import { cn } from "@/lib/utils";
import {
  ArrowsClockwise,
  CheckCircle,
  ClipboardText,
  Info,
  XCircle,
} from "@phosphor-icons/react";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Previa do impacto, so' pra tela: quem grava o lucro de verdade e' o backend,
// em calculateProfit. Se os dois divergirem, o backend manda.
function lucroSugerido(s: SettlementSuggestion): number {
  if (s.suggestedResultId === ResultIdEnum.WON) return s.stake * (s.odd - 1);
  if (s.suggestedResultId === ResultIdEnum.LOST) return -s.stake;
  return 0; // CANCELED devolve a aposta
}

function ResultBadge({ resultId }: { resultId: ResultIdEnum }) {
  const map = {
    [ResultIdEnum.WON]: { label: "Ganhou", cls: "bg-green-500/[0.12] border-green-500/25 text-green-400" },
    [ResultIdEnum.LOST]: { label: "Perdeu", cls: "bg-red-500/[0.12] border-red-500/25 text-red-400" },
    [ResultIdEnum.CANCELED]: { label: "Devolvida", cls: "bg-white/[0.06] border-white/10 text-zinc-300" },
  } as Record<number, { label: string; cls: string }>;
  const it = map[resultId] ?? map[ResultIdEnum.CANCELED];
  return (
    <span className={cn("shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium", it.cls)}>
      {it.label}
    </span>
  );
}

function SuggestionRow({
  suggestion,
  checked,
  onToggle,
}: {
  suggestion: SettlementSuggestion;
  checked: boolean;
  onToggle: () => void;
}) {
  const lucro = lucroSugerido(suggestion);
  const placar =
    suggestion.homeScore != null && suggestion.awayScore != null
      ? `${suggestion.homeScore} x ${suggestion.awayScore}`
      : null;

  return (
    <li
      className={cn(
        "rounded-xl border p-3 transition-colors",
        checked
          ? "border-accent/40 bg-white/[0.04]"
          : "border-white/10 bg-white/[0.02]",
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          className="mt-1 shrink-0"
          aria-label={`Selecionar ${suggestion.game}`}
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {suggestion.game}
              </p>
              <p className="truncate text-xs text-zinc-400">{suggestion.market}</p>
            </div>
            <ResultBadge resultId={suggestion.suggestedResultId} />
          </div>

          {/* A explicacao e' o que deixa conferir sem abrir a casa de aposta. */}
          <p className="text-xs text-zinc-500">
            {placar && <span className="font-medium text-zinc-300">{placar}</span>}
            {placar && " · "}
            {suggestion.explanation}
          </p>

          <p className="text-xs text-zinc-500">
            {BRL.format(suggestion.stake)} @ {suggestion.odd.toFixed(2)} ·{" "}
            <span
              className={cn(
                "font-medium",
                lucro > 0 ? "text-green-400" : lucro < 0 ? "text-red-400" : "text-zinc-300",
              )}
            >
              {lucro > 0 ? "+" : ""}
              {BRL.format(lucro)}
            </span>
          </p>
        </div>
      </label>
    </li>
  );
}

// O que o ultimo calculo deixou pendurado. As duas coisas eram silencio antes:
// aposta com jogo encerrado que o bot nao soube resolver ficava invisivel, e
// lote cheio dava a impressao de que nao havia mais nada esperando.
function ComputeNotes({
  summary,
  busy,
  onCompute,
}: {
  summary: ComputeSummary | undefined;
  busy: boolean;
  onCompute: () => void;
}) {
  if (!summary || (!summary.undecided && !summary.hasMore)) return null;
  const { undecided, hasMore } = summary;
  const plural = undecided === 1 ? "" : "s";

  return (
    <div className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      {!!undecided && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-400">
          <Info size={14} className="mt-0.5 shrink-0 text-zinc-500" />
          <span>
            {undecided} aposta{plural} com o jogo encerrado que o bot não soube
            resolver. Segue{plural === "s" ? "m" : ""} pendente{plural} na lista
            de apostas, pra você resolver na mão.
          </span>
        </p>
      )}
      {hasMore && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            Ainda sobrou aposta fora deste lote.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onCompute}
            disabled={busy}
            className="shrink-0"
          >
            Calcular o resto
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ConferirPage() {
  const { data: suggestions, isLoading } = useSettlementSuggestions();
  const { compute, confirm, dismiss } = useSettlementActions();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const lista = useMemo(() => suggestions ?? [], [suggestions]);

  // betIds que a tela ja' mostrou. Sem isso, todo refetch remarcava a lista
  // inteira e desfazia o que o usuario tinha desmarcado de proposito. Ver
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
  const total = lista
    .filter((s) => selected.has(s.betId))
    .reduce((sum, s) => sum + lucroSugerido(s), 0);
  const ocupado = confirm.isPending || dismiss.isPending || compute.isPending;

  return (
    <MainLayout
      title="Conferir resultados"
      subtitle={
        lista.length
          ? `${lista.length} aposta${lista.length === 1 ? "" : "s"} com resultado pronto`
          : "Nada aguardando conferência"
      }
      titleWrapperClassName="flex items-baseline gap-2.5 min-w-0"
      titleClassName="text-2xl font-semibold tracking-tight shrink-0"
      subtitleClassName="text-sm text-zinc-500 truncate"
      mobileHeader={
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight">Conferir</h1>
          <span className="text-sm text-zinc-500">{lista.length}</span>
        </div>
      }
    >
      <div className="space-y-4 pb-40">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            Nada entra na planilha sem você confirmar.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => compute.mutate()}
            disabled={ocupado}
            className="shrink-0 gap-2"
          >
            <ArrowsClockwise
              size={16}
              className={compute.isPending ? "animate-spin" : undefined}
            />
            Buscar resultados
          </Button>
        </div>

        <ComputeNotes
          summary={compute.data}
          busy={ocupado}
          onCompute={() => compute.mutate()}
        />

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" delay={i * 60} />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <ClipboardText size={32} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              Nenhuma aposta com resultado pronto.
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Assim que os jogos terminarem e o placar for coletado, as
              sugestões aparecem aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() =>
                  setSelected(
                    selected.size === lista.length
                      ? new Set()
                      : new Set(lista.map((s) => s.betId)),
                  )
                }
                className="text-zinc-400 underline-offset-4 hover:underline"
              >
                {selected.size === lista.length ? "Desmarcar todas" : "Marcar todas"}
              </button>
              <span className="text-zinc-500">
                {selected.size} de {lista.length}
              </span>
            </div>

            <ul className="space-y-2">
              {lista.map((s) => (
                <SuggestionRow
                  key={s.betId}
                  suggestion={s}
                  checked={selected.has(s.betId)}
                  onToggle={() => toggle(s.betId)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {selected.size > 0 && (
        <div
          role="toolbar"
          aria-label="Confirmar resultados"
          className={cn(
            "fixed z-50 space-y-3 rounded-2xl border border-white/10 bg-zinc-900/95 p-3 backdrop-blur-md",
            "animate-in slide-in-from-bottom-4 duration-200",
            "inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))]",
            "md:inset-x-auto md:bottom-6 md:left-1/2 md:w-full md:max-w-[480px] md:-translate-x-1/2",
          )}
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <div className="flex items-center justify-between px-1 text-sm">
            <span className="font-semibold text-white">
              {selected.size} selecionada{selected.size === 1 ? "" : "s"}
            </span>
            <span
              className={cn(
                "font-semibold",
                total > 0 ? "text-green-400" : total < 0 ? "text-red-400" : "text-zinc-300",
              )}
            >
              {total > 0 ? "+" : ""}
              {BRL.format(total)}
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button
              onClick={() => confirm.mutate(ids)}
              disabled={ocupado}
              className="min-h-[48px] gap-2 bg-green-500 text-base font-semibold text-white hover:bg-green-600"
            >
              <CheckCircle size={20} weight="fill" />
              Planilhar {selected.size === lista.length ? "todas" : selected.size}
            </Button>
            <Button
              variant="ghost"
              onClick={() => dismiss.mutate(ids)}
              disabled={ocupado}
              aria-label="Descartar sugestões selecionadas"
              className="min-h-[48px] px-4 text-zinc-300"
            >
              <XCircle size={20} />
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
