import { Link, useNavigate } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultIdEnum } from "@/api/routes/get-bets";
import { useSettlementReview } from "@/hooks/apostas/use-settlement";
import { diaRelativo } from "@/lib/settlement-view";
import { formatTime, formatOdd } from "@/lib/format";
import { stakeCurta } from "@/lib/settlement-format";

/**
 * As apostas que o bot nao soube resolver, em tela propria. Na Conferencia elas
 * so' aparecem como um cartao: misturar "o bot propos" com "voce resolve na
 * mao" na mesma lista era o que confundia.
 */
export default function ConferirPendentesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useSettlementReview(true);
  const n = data?.length ?? 0;

  return (
    <MainLayout
      title="Conferência"
      subtitle={n ? `${n} pra liquidar na mão` : undefined}
      mobileHeader={
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="-ml-1 p-1 text-zinc-400 hover:text-foreground"
          >
            <CaretLeft size={20} />
          </button>
          <h1 className="truncate text-lg font-semibold">Conferência</h1>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" delay={i * 60} />
          ))}
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.015]">
          <header className="border-b border-foreground/[0.06] px-4 py-3">
            <h2 className="text-xl font-semibold text-foreground">Nada pra confirmar</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {n
                ? `${n === 1 ? "Esta o bot não resolveu" : `Estas ${n} o bot não resolveu`} — liquide na mão quando quiser.`
                : "O bot resolveu tudo que tinha placar."}
            </p>
          </header>
          <ul>
            {data?.map((b) => (
              <li
                key={b.betId}
                className="flex items-center gap-3 border-b border-foreground/[0.06] px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-zinc-500">
                    {b.eventStartAt &&
                      `${diaRelativo(b.eventStartAt)} ${formatTime(b.eventStartAt)} · `}
                    {stakeCurta(Number(b.stake))} @ {formatOdd(b.odd)}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">{b.game}</p>
                  <p className="truncate text-xs text-zinc-400">{b.market}</p>
                  {b.explanation && (
                    <p className="truncate text-[11px] text-zinc-600">{b.explanation}</p>
                  )}
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link
                    to={`/bets?status=${ResultIdEnum.PENDING}&period=tudo&q=${encodeURIComponent(b.game)}`}
                  >
                    Liquidar
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </MainLayout>
  );
}
