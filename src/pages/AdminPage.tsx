import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowClockwise } from "@phosphor-icons/react";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { PipelineHealth, buildGroups, countAlerts } from "@/components/admin/PipelineHealth";
import { useAdminOverview } from "@/hooks/queries/use-admin";
import { formatSaoPaulo } from "@/lib/admin-health";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const isMobile = useIsMobile();
  const overview = useAdminOverview();
  // No celular o gesto substitui o botão, como nas outras telas do app.
  const pull = usePullToRefresh(() => overview.refetch(), isMobile);
  const alerts = overview.data ? countAlerts(buildGroups(overview.data)) : 0;

  // `dataUpdatedAt` em vez de um Date.now() guardado à parte: quem sabe quando
  // o número na tela chegou é o cache, não a tela.
  const updatedAt = overview.dataUpdatedAt ? formatSaoPaulo(new Date(overview.dataUpdatedAt).toISOString()) : "—";

  const refresh = (
    <>
      <span className="text-xs opacity-40">atualizado {updatedAt}</span>
      <Button
        variant="outline"
        size="sm"
        disabled={overview.isFetching}
        onClick={() => void overview.refetch()}
      >
        <ArrowClockwise size={14} className={cn(overview.isFetching && "animate-spin")} />
        Atualizar
      </Button>
    </>
  );

  return (
    <MainLayout
      title="Admin"
      subtitle="Pipeline"
      actions={refresh}
      mobileHeader={
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          {overview.data && (
            <span className="text-sm opacity-50">
              {alerts === 0 ? "ok" : `${alerts} ${alerts === 1 ? "alerta" : "alertas"}`}
            </span>
          )}
        </div>
      }
    >
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />

      <AdminPanel
        eyebrow="Pipeline"
        title={!overview.data ? "Saúde do pipeline" : alerts === 0 ? "Tudo rodando" : `${alerts} ${alerts === 1 ? "alerta" : "alertas"}`}
        description="Telegram → tip → fan-out → coletor → liquidação · horário de Brasília"
      >
        <div className="p-4 sm:p-6">
          <PipelineHealth
            data={overview.data}
            isPending={overview.isPending}
            isError={overview.isError}
            onRetry={() => void overview.refetch()}
          />
        </div>
      </AdminPanel>
    </MainLayout>
  );
}
