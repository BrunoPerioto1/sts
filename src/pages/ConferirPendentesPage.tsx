import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SelectCheck } from "@/components/ui/select-check";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultIdEnum } from "@/api/routes/get-bets";
import type { SettlementReviewItem } from "@/api/routes/get-settlement";
import { useSettlementActions, useSettlementReview } from "@/hooks/apostas/use-settlement";
import { tintStyle, usePerformanceColor } from "@/hooks/use-performance-color";
import { SelectionBar } from "@/components/conferir/selection";
import { SelectToggleButton } from "@/components/ui/select-toggle-button";
import { diaRelativo } from "@/lib/settlement-view";
import { formatInt, formatMoney, formatTime, formatOdd } from "@/lib/format";
import { cn } from "@/lib/utils";

const liquidarHref = (b: SettlementReviewItem) =>
  `/bets?status=${ResultIdEnum.PENDING}&period=tudo&q=${encodeURIComponent(b.game)}`;
const quandoDe = (b: SettlementReviewItem) =>
  b.eventStartAt ? `${diaRelativo(b.eventStartAt)} ${formatTime(b.eventStartAt)}` : "sem data";
const apostaDe = (b: SettlementReviewItem) =>
  `${formatMoney(Number(b.stake), { cents: "auto" })} @ ${formatOdd(b.odd)}`;

const DESKTOP_COLS = "md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_140px_120px]";
const DESKTOP_COLS_SEL = "md:grid-cols-[40px_minmax(0,1.3fr)_minmax(0,1.4fr)_140px]";

/**
 * As apostas que o bot nao soube resolver, em tela propria. Na Conferencia elas
 * so' aparecem como um cartao: misturar "o bot propos" com "voce resolve na
 * mao" na mesma lista era o que confundia. "Liquidar" leva a aposta em
 * Apostas; com "Selecionar" da' pra resolver varias de uma vez.
 */
export default function ConferirPendentesPage() {
  const { data, isLoading } = useSettlementReview(true);
  const { settleManual } = useSettlementActions();
  const color = usePerformanceColor();
  const lista = useMemo(() => data ?? [], [data]);
  const n = lista.length;

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  useEffect(() => {
    setSelected((prev) => {
      const vivos = new Set(lista.map((b) => b.betId));
      const next = new Set([...prev].filter((id) => vivos.has(id)));
      return next.size === prev.size ? prev : next;
    });
    if (!lista.length) setSelecting(false);
  }, [lista]);

  const sair = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const ids = [...selected];
  const marcadas = ids.length;
  const todas = n > 0 && marcadas === n;

  const liquidar = (resultId: ResultIdEnum) => {
    settleManual.mutate({ betIds: ids, resultId });
    sair();
  };

  const selectButton = n > 0 && (
    <SelectToggleButton selecting={selecting} onToggle={() => (selecting ? sair() : setSelecting(true))} />
  );
  const lote = [
    { resultId: ResultIdEnum.WON, label: "Ganhou", sign: 1 },
    { resultId: ResultIdEnum.LOST, label: "Perdeu", sign: -1 },
    { resultId: ResultIdEnum.CANCELED, label: "Anulada", sign: 0 },
  ] as const;

  return (
    <MainLayout
      title="Liquidar na mão"
      subtitle={n ? `${n} que o bot não resolveu · Liquidar abre a aposta em Apostas` : undefined}
      actions={selectButton}
      hideBottomNav={selecting}
      mobileHeader={
        <PageHeader
          back
          title="Liquidar na mão"
          subtitle={n ? `${formatInt(n)} que o bot não resolveu` : undefined}
          actions={selectButton}
        />
      }
    >
      <div className={cn("space-y-3.5", selecting ? "pb-44 md:pb-28" : "pb-6")}>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" delay={i * 60} />
            ))}
          </div>
        ) : n === 0 ? (
          <div className="flex flex-col gap-1.5 rounded-2xl border border-foreground/10 bg-card px-5 py-6 md:px-7">
            <p className="text-[17px] font-semibold text-foreground">Tudo liquidado</p>
            <p className="text-[13px] text-zinc-500">Nenhuma aposta esperando você.</p>
          </div>
        ) : (
          <>
            {selecting && (
              <label className="flex items-center gap-3 px-1 text-[13.5px] tabular-nums md:hidden">
                <button
                  type="button"
                  onClick={() => setSelected(todas ? new Set() : new Set(lista.map((b) => b.betId)))}
                  aria-label={todas ? "Desmarcar todas" : "Selecionar todas"}
                  className="press rounded-full"
                >
                  <SelectCheck checked={todas} indeterminate={!todas && marcadas > 0} />
                </button>
                {marcadas} de {n} selecionadas
              </label>
            )}

            <ul className="overflow-hidden rounded-2xl border border-foreground/10 bg-card">
              {selecting && (
                <li className={cn("hidden h-11 items-center gap-5 border-b border-foreground/[0.07] px-5 text-[11px] font-medium tracking-wider text-zinc-500 md:grid", DESKTOP_COLS_SEL)}>
                  <button
                    type="button"
                    onClick={() => setSelected(todas ? new Set() : new Set(lista.map((b) => b.betId)))}
                    aria-label={todas ? "Desmarcar todas" : "Selecionar todas"}
                    className="press rounded-full"
                  >
                    <SelectCheck checked={todas} indeterminate={!todas && marcadas > 0} />
                  </button>
                  <span>{marcadas} DE {n}</span>
                </li>
              )}
              {lista.map((b) => {
                const checked = selected.has(b.betId);
                const liquidarBtn = (
                  <Button asChild variant="secondary" className="h-10 shrink-0 rounded-lg px-3.5 md:h-9">
                    <Link to={liquidarHref(b)} onClick={(e) => e.stopPropagation()}>
                      Liquidar
                      <ArrowUpRight size={13} className="hidden text-zinc-500 md:block" />
                    </Link>
                  </Button>
                );
                return (
                  <li
                    key={b.betId}
                    onClick={selecting ? () => toggle(b.betId) : undefined}
                    aria-pressed={selecting ? checked : undefined}
                    className={cn(
                      "border-t border-foreground/[0.06] transition-colors first:border-t-0",
                      selecting && "cursor-pointer",
                      checked && "bg-accent/[0.08]",
                    )}
                  >
                    {/* Mobile: quando e quanto em cima, o jogo, o mercado e o
                        porquê do bot não ter resolvido. */}
                    <div className="flex items-start gap-3 px-4 py-3.5 md:hidden">
                      {selecting && <SelectCheck checked={checked} className="mt-0.5" />}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs tabular-nums text-zinc-500">{quandoDe(b)} · {apostaDe(b)}</p>
                        <p className="text-[15px] font-semibold leading-snug text-foreground">{b.game}</p>
                        <p className="text-[12.5px] text-zinc-400">{b.market}</p>
                        {b.explanation && <p className="text-xs leading-snug text-zinc-500">{b.explanation}</p>}
                      </div>
                      {!selecting && <div className="self-center">{liquidarBtn}</div>}
                    </div>

                    <div className={cn("hidden h-16 items-center gap-5 px-5 md:grid", selecting ? DESKTOP_COLS_SEL : DESKTOP_COLS)}>
                      {selecting && <SelectCheck checked={checked} />}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{b.game}</p>
                        <p className="truncate text-[12.5px] text-zinc-400">{b.market}</p>
                      </div>
                      <p className="truncate text-[12.5px] text-zinc-500">{b.explanation}</p>
                      <p className="text-right text-[13px] tabular-nums text-zinc-500">{apostaDe(b)}</p>
                      {!selecting && <div className="justify-self-end">{liquidarBtn}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {selecting && (
        <SelectionBar label={`${marcadas} de ${n} selecionadas`}>
          <div className="grid grid-cols-3 gap-2 md:flex">
            {lote.map((o) => (
              <Button
                key={o.resultId}
                variant="secondary"
                disabled={!marcadas || settleManual.isPending}
                onClick={() => liquidar(o.resultId)}
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
