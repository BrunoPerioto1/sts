import { useEffect, useState } from "react";
import { CalendarSlash } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { DailyEvolutionChart } from "@/components/dashboard/DailyEvolutionChart";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainMetrics } from "@/components/dashboard/MainMetrics";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { useDashboardFilters, type DatePreset } from "@/hooks/dashboard/useDashboardFilters";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";
import { getBets, type BetItem } from "@/api/routes/get-bets";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

function RecentBetRow({ bet }: { bet: BetItem }) {
  const profit = bet.profit != null ? Number(bet.profit) : null;
  const date = new Date(bet.betTime);
  return (
    <div className="bg-card rounded-md p-3 flex flex-col gap-2" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-[13.5px] leading-snug truncate">{bet.game}</p>
        <span
          className={cn(
            "tabular-nums text-[13px] font-medium shrink-0 whitespace-nowrap",
            profit == null ? "opacity-35" : profit >= 0 ? "text-positive" : "text-negative",
          )}
        >
          {profit == null ? "—" : `${profit >= 0 ? "+" : ""}R$ ${profit.toFixed(2)}`}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11.5px] opacity-60">
        <span>
          {date.toLocaleDateString("pt-BR")} {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span>{bet.houseName ?? "—"} · odd {Number(bet.odd).toFixed(2)} · R$ {Number(bet.stake).toFixed(2)}</span>
      </div>
    </div>
  );
}

function DashboardPageContent() {
  const { filters, preset, setPreset, setCustomRange, setHouseId, hasNoBets, ready } = useDashboardFilters();
  const { houses, metrics, dailyData, loading, reload } = useDashboardData(filters);
  const [recentBets, setRecentBets] = useState<BetItem[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!ready) return;
    getBets({ startDate: filters.startDate, endDate: filters.endDate, page: 1, perPage: 5 })
      .then((res) => setRecentBets(res.data ?? []))
      .catch(() => setRecentBets([]));
  }, [filters, ready]);

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          options={[
            { value: "currentMonth", label: "Mês atual" },
            { value: "60d", label: "60 dias" },
            { value: "90d", label: "90 dias" },
            { value: "allTime", label: "Desde sempre" },
          ]}
          value={preset === "custom" ? "currentMonth" : preset}
          onChange={(v) => setPreset(v as DatePreset)}
        />
      </div>

      <DashboardFilter
        houses={houses.map((h) => ({ id: h.id, name: h.name }))}
        houseId={filters.houseId}
        onHouseChange={setHouseId}
        startDate={filters.startDate}
        endDate={filters.endDate}
        onCustomRange={setCustomRange}
      />

      <MainMetrics metrics={metrics} profitSparkline={dailyData.slice(-8).map((d) => d.profitDay)} />

      <DailyEvolutionChart data={dailyData} />

      <div className="card elev-sm bg-card rounded-md p-[14px_16px]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium">Últimas apostas</h3>
          <Link to="/bets" className="text-accent text-sm hover:underline">Ver todas</Link>
        </div>
        {recentBets.length === 0 ? (
          <p className="text-[12.5px] opacity-55 py-6 text-center">Nenhuma aposta neste período.</p>
        ) : isMobile ? (
          <div className="space-y-3">
            {recentBets.map((bet) => (
              <RecentBetRow key={bet.id} bet={bet} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal">Data</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal">Evento</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal">Casa</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Odd</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Stake</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Retorno</th>
                </tr>
              </thead>
              <tbody>
                {recentBets.map((bet) => {
                  const profit = bet.profit != null ? Number(bet.profit) : null;
                  return (
                    <tr key={bet.id} className="hover:bg-foreground/[0.04]">
                      <td className="py-2 opacity-60 whitespace-nowrap">
                        {new Date(bet.betTime).toLocaleDateString("pt-BR")}{" "}
                        {new Date(bet.betTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2">{bet.game}</td>
                      <td className="py-2 opacity-80">{bet.houseName ?? "—"}</td>
                      <td className="py-2 text-right tabular-nums">{Number(bet.odd).toFixed(2)}</td>
                      <td className="py-2 text-right tabular-nums">R$ {Number(bet.stake).toFixed(2)}</td>
                      <td className={`py-2 text-right tabular-nums ${profit == null ? "opacity-35" : profit >= 0 ? "text-positive" : "text-negative"}`}>
                        {profit == null ? "—" : `${profit >= 0 ? "+" : ""}R$ ${profit.toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  return (
    <MainLayout title="Dashboard">
      <DashboardPageContent />
    </MainLayout>
  );
}
