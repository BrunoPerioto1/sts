import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { formatInt, formatOdd, formatPercent } from "@/lib/format";
import { DashboardCard } from "./DashboardCard";

// Meia-lua de 0% (esquerda) a 100% (direita), centro em (120, 130), raio 90.
const CX = 120;
const CY = 130;
const ARC = "M 30 130 A 90 90 0 0 1 210 130";
const TRACK = "color-mix(in srgb, var(--color-text) 10%, transparent)";

function Row({ label, value, legend, title }: { label: string; value: string; legend?: boolean; title?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-dashed border-foreground/10 py-2.5 text-[13px]" title={title}>
      <span className="flex items-center gap-2 text-zinc-400">
        {legend && <span className="h-0.5 w-2.5 rounded-full bg-foreground" aria-hidden="true" />}
        {label}
      </span>
      <span className="font-medium tabular-nums text-zinc-200">{value}</span>
    </div>
  );
}

/**
 * Taxa de acerto contra o ponto de empate (1 ÷ odd média): o acerto mínimo
 * pra não perder dinheiro nas odds que você pega. 60% de acerto em odd 1,50 é
 * prejuízo; 35% em odd 3,50 é lucro — o número sozinho não diz isso.
 */
export function HitRateCard({
  metrics,
  className,
  style,
}: {
  metrics: DashboardMetrics;
  className?: string;
  style?: React.CSSProperties;
}) {
  const won = Number(metrics.wonBets);
  const decided = won + Number(metrics.lostBets);
  const hit = Number(metrics.hitRate);
  const odd = Number(metrics.averageOdd);
  // Odd média é simples (não ponderada pelo stake): boa aproximação do empate.
  const breakEven = odd > 1 ? 1 / odd : null;
  const angle = breakEven != null ? Math.PI * (1 - breakEven) : 0;
  const tick = (r: number) => ({ x: CX + r * Math.cos(angle), y: CY - r * Math.sin(angle) });

  return (
    <DashboardCard title="Taxa de acerto" className={className} style={style}>
      {decided === 0 ? (
        <p className="flex flex-1 items-center justify-center py-8 text-center text-[13px] text-zinc-400">
          Nenhuma aposta ganha ou perdida no período.
        </p>
      ) : (
        <>
          <div className="flex flex-1 items-center justify-center">
            <svg
              viewBox="0 0 240 150"
              className="block w-full max-w-[300px]"
              role="img"
              aria-label={`Acerto de ${formatPercent(hit)}${breakEven != null ? `; ponto de empate em ${formatPercent(breakEven)}` : ""}`}
            >
              <path d={ARC} fill="none" stroke={TRACK} strokeWidth={14} strokeLinecap="round" />
              {hit > 0 && (
                <path
                  d={ARC}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={14}
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${hit * 100} 100`}
                />
              )}
              {breakEven != null && (
                <line x1={tick(78).x} y1={tick(78).y} x2={tick(102).x} y2={tick(102).y} stroke="var(--color-text)" strokeWidth={2.5} strokeLinecap="round" />
              )}
              <text x={CX} y={112} fill="var(--color-text)" fontSize={30} fontWeight={600} textAnchor="middle" className="tabular-nums">
                {formatPercent(hit)}
              </text>
              <text x={CX} y={134} fill="var(--color-text)" opacity={0.5} fontSize={12} textAnchor="middle">
                {formatInt(won)} de {formatInt(decided)} acertos
              </text>
            </svg>
          </div>
          <div className="pt-3">
            <Row
              label="Ponto de empate"
              legend
              value={breakEven != null ? formatPercent(breakEven) : "—"}
              title="Acerto mínimo pra não perder dinheiro na odd média: 1 ÷ odd média"
            />
            <Row label="Odd média" value={formatOdd(odd, { decimals: 2 })} />
          </div>
        </>
      )}
    </DashboardCard>
  );
}
