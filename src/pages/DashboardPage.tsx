import { useEffect, useState } from "react";
import { Info, CalendarSlash } from "@phosphor-icons/react";
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

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function DashboardPageContent() {
  const { filters, preset, setPreset, setCustomRange, setHouseId, lastBetDate, hasNoBets, ready } = useDashboardFilters();
  const { houses, metrics, dailyData, loading, reload } = useDashboardData(filters);
  const [recentBets, setRecentBets] = useState<BetItem[]>([]);

  useEffect(() => {
    if (!ready) return;
    getBets({ startDate: filters.startDate, endDate: filters.endDate, page: 1, perPage: 5 })
      .then((res) => setRecentBets(res.data ?? []))
      .catch(() => setRecentBets([]));
  }, [filters, ready]);

  if (ready && hasNoBets) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-border rounded-md">
        <CalendarSlash size={30} className="opacity-35 mb-3" />
        <h3 className="text-base font-medium mb-1">Nenhuma aposta registrada ainda</h3>
        <p className="text-[12.5px] opacity-60 max-w-sm mb-4">
          Registre sua primeira aposta pelo Telegram ou por aqui para começar a ver suas métricas.
        </p>
        <Button asChild>
          <Link to="/apostas">Nova aposta</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          options={[
            { value: "lastWithData", label: "Com dados" },
            { value: "90d", label: "90 dias" },
            { value: "allTime", label: "Desde sempre" },
          ]}
          value={preset === "custom" ? "lastWithData" : preset}
          onChange={(v) => setPreset(v as DatePreset)}
        />
      </div>

      {preset === "lastWithData" && lastBetDate && (
        <div
          className="flex items-center justify-between gap-3 rounded-md p-3 text-[12.5px]"
          style={{
            background: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
            boxShadow: "inset 2px 0 0 var(--color-accent)",
          }}
        >
          <div className="flex items-center gap-2">
            <Info size={16} className="text-accent shrink-0" />
            <span>
              Mostrando <strong>o último período com apostas registradas</strong> ({formatDate(filters.startDate)} – {formatDate(filters.endDate)}).
            </span>
          </div>
          <button onClick={() => setPreset("allTime")} className="text-accent hover:underline whitespace-nowrap">
            Ver desde sempre
          </button>
        </div>
      )}

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
          <Link to="/apostas" className="text-accent text-sm hover:underline">Ver todas</Link>
        </div>
        {recentBets.length === 0 ? (
          <p className="text-[12.5px] opacity-55 py-6 text-center">Nenhuma aposta neste período.</p>
        ) : (
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
                    <td className="py-2 opacity-60">{new Date(bet.betTime).toLocaleDateString("pt-BR")}</td>
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
