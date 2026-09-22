import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdminOverview } from "@/hooks/queries/use-admin";
import { formatSaoPaulo } from "@/lib/admin-health";
import { cn } from "@/lib/utils";

/**
 * Tips das últimas 24h que não geraram DM. Tela à parte, e não um "ver mais"
 * dentro do card: o texto da tip ocupa três linhas e cada uma dessas linhas é
 * pra ler, não pra contar — espremida no card ela empurrava o resto do painel
 * pra fora da tela.
 */
export default function AdminTipsPage() {
  const isMobile = useIsMobile();
  const { data, isPending, isError, refetch } = useAdminOverview();
  const pull = usePullToRefresh(() => refetch(), isMobile);

  const tips = data?.undeliveredTips ?? [];
  const expected = data?.undeliveredExpected ?? 0;

  const back = (
    <Button variant="outline" size="sm" asChild>
      <Link to="/admin/pipeline">
        <ArrowLeft size={14} /> Pipeline
      </Link>
    </Button>
  );

  return (
    <MainLayout
      title="Tips sem entrega"
      subtitle={data ? `${tips.length} nas últimas 24h · ${expected} deveriam ter chegado em alguém` : undefined}
      actions={back}
      mobileHeader={
        <div className="flex items-center gap-3">
          <Link to="/admin/pipeline" className="press opacity-60" aria-label="Voltar para o admin">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight truncate">Tips sem entrega</h1>
        </div>
      }
    >
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" delay={i * 60} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Não foi possível carregar as tips"
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar de novo
            </Button>
          }
        />
      ) : tips.length === 0 ? (
        <EmptyState
          title="Nenhuma tip ficou sem entrega"
          description="Todas as tips das últimas 24h viraram DM para alguém."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-xs opacity-40 max-w-prose">
            Tip abaixo do filtro de % de todo mundo não entrega, e isso é o filtro funcionando. As
            marcadas em laranja passariam pelo filtro de alguém que recebe DM hoje — essas merecem
            olhada. O fan-out também pula quem saiu do grupo de Tips, o que daqui não dá pra ver.
          </p>

          <div className="space-y-2">
            {tips.map((tip) => (
              <div
                key={tip.id}
                className={cn(
                  "rounded-lg border bg-card p-3.5",
                  tip.expectedDelivery ? "border-[var(--dashboard-orange)]/35" : "border-border",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      "text-sm font-medium tabular-nums",
                      tip.expectedDelivery ? "text-[var(--dashboard-orange)]" : "opacity-45",
                    )}
                  >
                    {tip.percent === null ? "sem %" : `${tip.percent}%`}
                  </span>
                  {tip.expectedDelivery && (
                    <span className="text-[10px] uppercase tracking-wider text-[var(--dashboard-orange)] opacity-80">
                      deveria ter entregue
                    </span>
                  )}
                  <span className="ml-auto text-xs opacity-35">{formatSaoPaulo(tip.createdAt)}</span>
                </div>
                {/* whitespace-pre-line: o texto da tip vem do Telegram com as
                    quebras que o autor escreveu — casa, jogo, mercado, odd. */}
                <p className="text-sm opacity-70 whitespace-pre-line leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
