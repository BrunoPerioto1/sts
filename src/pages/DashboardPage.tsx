import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarSlash } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { DailyEvolutionChart } from "@/components/dashboard/DailyEvolutionChart";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainMetrics } from "@/components/dashboard/MainMetrics";
import { Segmented } from "@/components/ui/segmented";
import { DateRangeField } from "@/components/ui/date-range-field";
import { Button } from "@/components/ui/button";
import { useDashboardFilters, type DatePreset } from "@/hooks/dashboard/useDashboardFilters";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";
import { Spinner } from "@/components/ui/spinner";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";

interface DashboardPageContentProps {
  hasNoBets: boolean;
  ready: boolean;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  dailyData: DailySummaryPoint[];
}

function DashboardPageContent({
  hasNoBets,
  ready,
  metrics,
  previousMetrics,
  dailyData,
}: DashboardPageContentProps) {
  if (!ready) {
    return (
      <div className="py-24">
        <Spinner label="Carregando dashboard…" />
      </div>
    );
  }

  if (ready && hasNoBets) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-border rounded-md">
        <CalendarSlash size={30} className="opacity-35 mb-3" />
        <h3 className="text-base font-medium mb-1">Nenhuma aposta registrada ainda</h3>
        <p className="text-[12.5px] opacity-60 max-w-sm mb-4">
          Registre sua primeira aposta pelo Telegram ou por aqui para começar a ver suas métricas.
        </p>
        <Button asChild>
          <Link to="/bets">Nova aposta</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <DailyEvolutionChart data={dailyData} />

      <MainMetrics metrics={metrics} previousMetrics={previousMetrics} />
    </div>
  );
}

export function DashboardPage() {
  const { filters, preset, setPreset, setCustomRange, hasNoBets, ready } = useDashboardFilters();
  const { metrics, previousMetrics, dailyData } = useDashboardData(filters);

  const rangeLabel =
    ready && filters.startDate && filters.endDate
      ? `${format(parseISO(filters.startDate), "dd MMM", { locale: ptBR })} – ${format(parseISO(filters.endDate), "dd MMM", { locale: ptBR })}`
      : undefined;

  const headerControls = (
    <>
      <Segmented
        options={[
          { value: "currentMonth", label: "Mês atual" },
          { value: "60d", label: "60 dias" },
        ]}
        value={preset as "currentMonth" | "60d"}
        onChange={(v) => setPreset(v as DatePreset)}
      />
      <DateRangeField
        startDate={filters.startDate}
        endDate={filters.endDate}
        onChange={(from, to) => setCustomRange(from, to)}
        iconOnly
      />
    </>
  );

  return (
    <MainLayout
      title="Dashboard"
      subtitle={rangeLabel}
      mobileHeader={
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-[19px] font-semibold">Dashboard</h1>
            {rangeLabel && <span className="text-[12.5px] opacity-50">{rangeLabel}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">{headerControls}</div>
        </div>
      }
      actions={headerControls}
    >
      <DashboardPageContent
        hasNoBets={hasNoBets}
        ready={ready}
        metrics={metrics}
        previousMetrics={previousMetrics}
        dailyData={dailyData}
      />
    </MainLayout>
  );
}
