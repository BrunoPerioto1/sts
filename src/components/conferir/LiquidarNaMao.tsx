import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectCheck } from "@/components/ui/select-check";
import { ResultIdEnum } from "@/api/routes/get-bets";
import type { SettlementReviewItem } from "@/api/routes/get-settlement";
import { diaRelativo } from "@/lib/settlement-view";
import { formatMoney, formatOdd, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { useSelecao } from "./selection";

const liquidarHref = (b: SettlementReviewItem) =>
  `/bets?status=${ResultIdEnum.PENDING}&period=tudo&q=${encodeURIComponent(b.game)}`;
const quandoDe = (b: SettlementReviewItem) =>
  b.eventStartAt ? `${diaRelativo(b.eventStartAt)} ${formatTime(b.eventStartAt)}` : "sem data";
const apostaDe = (b: SettlementReviewItem) =>
  `${formatMoney(Number(b.stake), { cents: "auto" })} @ ${formatOdd(b.odd)}`;

const DESKTOP_COLS = "md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_140px_120px]";
const DESKTOP_COLS_SEL = "md:grid-cols-[40px_minmax(0,1.3fr)_minmax(0,1.4fr)_140px]";

/**
 * Aba "Liquidar na mão": as apostas que o bot não soube resolver. "Liquidar"
 * leva a aposta em Apostas; com "Selecionar" dá pra resolver várias de uma vez.
 */
export function LiquidarNaMao({ lista, sel }: { lista: SettlementReviewItem[]; sel: ReturnType<typeof useSelecao> }) {
  const { selecting } = sel;
  return (
    <ul className="overflow-hidden rounded-2xl border border-foreground/10 bg-card shadow-card">
      {lista.map((b) => {
        const checked = sel.selected.has(b.betId);
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
            onClick={selecting ? () => sel.toggle(b.betId) : undefined}
            aria-pressed={selecting ? checked : undefined}
            className={cn(
              "border-t border-foreground/[0.06] transition-colors first:border-t-0",
              selecting && "cursor-pointer",
              checked && "bg-accent/[0.08]",
            )}
          >
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
  );
}
