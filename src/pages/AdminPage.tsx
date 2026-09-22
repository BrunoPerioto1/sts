import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowClockwise } from "@phosphor-icons/react";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { PipelineHealth, buildGroups, countAlerts } from "@/components/admin/PipelineHealth";
import { useAdminOverview } from "@/hooks/queries/use-admin";
import { formatSaoPaulo } from "@/lib/admin-health";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const overview = useAdminOverview();
  const alerts = overview.data ? countAlerts(buildGroups(overview.data)) : 0;

  const subtitle = overview.data
    ? `${overview.data.usersByRole.admin + overview.data.usersByRole.moderator + overview.data.usersByRole.user} usuários · ${
        alerts === 0 ? "pipeline ok" : `${alerts} ${alerts === 1 ? "alerta" : "alertas"} no pipeline`
      }`
    : undefined;

  // `dataUpdatedAt` em vez de um Date.now() guardado à parte: quem sabe quando
  // o número na tela chegou é o cache, não a tela.
  const updatedAt = overview.dataUpdatedAt ? formatSaoPaulo(new Date(overview.dataUpdatedAt).toISOString()) : "—";

  const refresh = (
    <>
      <span className="hidden sm:inline text-xs opacity-40">atualizado {updatedAt}</span>
      <Button
        variant="outline"
        size="sm"
        disabled={overview.isFetching}
        onClick={() => void overview.refetch()}
      >
        <ArrowClockwise size={14} className={cn(overview.isFetching && "animate-spin")} />
        <span className="hidden sm:inline">Atualizar</span>
      </Button>
    </>
  );

  return (
    <MainLayout
      title="Admin"
      subtitle={subtitle}
      actions={refresh}
      mobileHeader={
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          {overview.data && (
            <span className="text-sm opacity-50">
              {alerts === 0 ? "ok" : `${alerts} ${alerts === 1 ? "alerta" : "alertas"}`}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">{refresh}</div>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xs uppercase tracking-wider opacity-45">Saúde do pipeline</h2>
            {/* Some no celular: cortada pela metade ela só rouba uma linha. */}
            <span className="hidden sm:inline text-xs opacity-30 truncate">
              Telegram → tip → fan-out → coletor → liquidação · horário de Brasília
            </span>
          </div>

          <PipelineHealth
            data={overview.data}
            isPending={overview.isPending}
            isError={overview.isError}
            onRetry={() => void overview.refetch()}
          />
        </section>

        <AdminUsers />
      </div>
    </MainLayout>
  );
}
