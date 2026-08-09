import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Segmented } from "@/components/ui/segmented";
import { Lightbulb, Trophy } from "@phosphor-icons/react";
import { format, subDays } from "date-fns";
import { getHouseRanking, type HouseRankingItem } from "@/api/routes/get-house-ranking";

type Metric = "roi" | "profit" | "hitRate";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function buildInsight(ranking: HouseRankingItem[]): string | null {
  if (ranking.length < 2) return null;
  const totalProfit = ranking.reduce((sum, h) => sum + Math.max(h.profit, 0), 0);
  const byProfit = [...ranking].sort((a, b) => b.profit - a.profit);
  const top2 = byProfit.slice(0, 2);
  const top2Share = totalProfit > 0 ? (top2.reduce((s, h) => s + Math.max(h.profit, 0), 0) / totalProfit) * 100 : 0;

  const avgStakeOverall = ranking.reduce((s, h) => s + h.avgStake, 0) / ranking.length;
  const aboveAvgStakeNegative = ranking.filter((h) => h.profit < 0 && h.avgStake > avgStakeOverall);

  const parts: string[] = [];
  if (top2Share >= 40 && top2[0].profit > 0) {
    parts.push(`${top2.map((h) => h.houseName).join(" e ")} concentram ${top2Share.toFixed(0)}% do seu lucro`);
  }
  if (aboveAvgStakeNegative.length > 0) {
    parts.push(`${aboveAvgStakeNegative.map((h) => h.houseName).join(", ")} ${aboveAvgStakeNegative.length > 1 ? "estão" : "está"} negativa${aboveAvgStakeNegative.length > 1 ? "s" : ""} com stake médio acima da sua média`);
  }

  if (parts.length === 0) return null;
  return `Leitura do período: ${parts.join("; ")}.`;
}

export default function ComparadorPage() {
  const [metric, setMetric] = useState<Metric>("roi");
  const [ranking, setRanking] = useState<HouseRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [range] = useState({ startDate: format(subDays(new Date(), 90), "yyyy-MM-dd"), endDate: format(new Date(), "yyyy-MM-dd") });

  useEffect(() => {
    setLoading(true);
    getHouseRanking({ startDate: range.startDate, endDate: range.endDate, minBets: 20 })
      .then(setRanking)
      .catch(() => setRanking([]))
      .finally(() => setLoading(false));
  }, [range]);

  const sorted = useMemo(() => {
    return [...ranking].sort((a, b) => b[metric] - a[metric]);
  }, [ranking, metric]);

  const podium = sorted.slice(0, 3);
  const maxAbsRoi = Math.max(...ranking.map((h) => Math.abs(h.roi) * 100), 1);
  const insight = buildInsight(ranking);

  return (
    <MainLayout title="Comparador">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] opacity-55">
            Só casas com 20+ apostas liquidadas · {new Date(range.startDate).toLocaleDateString("pt-BR")} – {new Date(range.endDate).toLocaleDateString("pt-BR")}
          </p>
          <Segmented
            options={[
              { value: "roi", label: "ROI" },
              { value: "profit", label: "Lucro" },
              { value: "hitRate", label: "Taxa de acerto" },
            ]}
            value={metric}
            onChange={(v) => setMetric(v as Metric)}
          />
        </div>

        {!loading && ranking.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-md">
            <Trophy size={30} className="opacity-35 mb-3" />
            <h3 className="text-base font-medium mb-1">Sem casas suficientes ainda</h3>
            <p className="text-[12.5px] opacity-55 max-w-sm text-center">
              Você precisa de pelo menos 20 apostas liquidadas em uma casa para ela aparecer no comparador.
            </p>
          </div>
        )}

        {podium.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {podium.map((h, i) => (
              <div key={h.houseId} className="card elev-sm bg-card rounded-md p-[14px_16px] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-[22px] h-[22px] rounded-md border border-accent flex items-center justify-center text-[12px] text-accent shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-[17px] font-medium">{h.houseName}</span>
                  <span className="tag bg-neutral-800 text-neutral-100 text-[11px] px-2 py-[3px] rounded-[6px] ml-auto">{h.settledBets} apostas</span>
                </div>
                <div className="flex items-end justify-between mt-1">
                  <div>
                    <div className="text-[10px] uppercase opacity-55 mb-0.5">ROI</div>
                    <div className={`text-[28px] font-medium tabular-nums ${h.roi >= 0 ? "text-positive" : "text-negative"}`}>
                      {(h.roi * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase opacity-55 mb-0.5">Lucro</div>
                    <div className={`text-[18px] font-medium tabular-nums ${h.profit >= 0 ? "text-positive" : "text-negative"}`}>
                      {h.profit >= 0 ? "+" : ""}{formatCurrency(h.profit)}
                    </div>
                    <div className="text-[10px] uppercase opacity-55 mt-1 mb-0.5">Acerto</div>
                    <div className="text-[18px] font-medium tabular-nums">{(h.hitRate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sorted.length > 0 && (
          <div className="card elev-sm bg-card rounded-md p-[14px_16px] overflow-x-auto">
            <table className="table w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-40 font-normal">#</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal">Casa</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal" style={{ width: 220 }}>ROI</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Lucro</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Apostas</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Acerto</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Odd média</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Stake médio</th>
                  <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((h, i) => {
                  const roiPct = h.roi * 100;
                  const barWidth = (Math.abs(roiPct) / maxAbsRoi) * 50;
                  return (
                    <tr key={h.houseId} className="border-b border-border hover:bg-foreground/[0.04]">
                      <td className="py-2 opacity-40">{i + 1}</td>
                      <td className="py-2 font-medium">{h.houseName}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="relative h-[5px] flex-1 rounded-full" style={{ background: "color-mix(in srgb, var(--color-text) 8%, transparent)" }}>
                            <div
                              className="absolute top-0 h-full rounded-full"
                              style={{
                                left: roiPct >= 0 ? "50%" : `${50 - barWidth}%`,
                                width: `${barWidth}%`,
                                background: roiPct >= 0 ? "#4ade9e" : "#f0797e",
                              }}
                            />
                          </div>
                          <span className={`tabular-nums w-14 text-right ${roiPct >= 0 ? "text-positive" : "text-negative"}`}>
                            {roiPct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className={`py-2 text-right tabular-nums ${h.profit >= 0 ? "text-positive" : "text-negative"}`}>
                        {h.profit >= 0 ? "+" : ""}{formatCurrency(h.profit)}
                      </td>
                      <td className="py-2 text-right tabular-nums opacity-70">{h.settledBets}</td>
                      <td className="py-2 text-right tabular-nums opacity-70">{(h.hitRate * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right tabular-nums opacity-70">{h.avgOdd.toFixed(2)}</td>
                      <td className="py-2 text-right tabular-nums opacity-70">{formatCurrency(h.avgStake)}</td>
                      <td className="py-2 text-right tabular-nums opacity-70">{formatCurrency(h.volume)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {insight && (
          <div
            className="flex items-start gap-2 rounded-md p-3 text-[12.5px]"
            style={{ background: "var(--color-surface)", boxShadow: "inset 2px 0 0 var(--color-accent)" }}
          >
            <Lightbulb size={16} className="text-accent shrink-0 mt-0.5" />
            <span>{insight}</span>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
