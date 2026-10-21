import { useEffect, useRef, useState } from "react";
import { ArrowsHorizontal } from "@phosphor-icons/react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDayMonth, formatMoney } from "@/lib/format";
import { AXIS_TICK, GRID_PROPS, compactAxis } from "@/lib/chart-style";
import { ChartTooltipBox } from "./ChartTooltipBox";

interface ProfitBarChartProps {
  data: { date: string; profitDay: number }[];
  height?: number;
  /** Cada ponto é uma semana (desktop agrupa períodos longos). */
  semanal?: boolean;
  /**
   * Leitura em tooltip que segue o ponteiro (dashboard no desktop) em vez da
   * faixa fixa em cima, que abre no melhor dia (celular e landing).
   */
  tooltip?: boolean;
}

/**
 * Barra com a ponta do dado arredondada e a base reta no zero: em cima pro
 * ganho, embaixo pra perda. O `radius` do Recharts arredonda os quatro cantos
 * ou trata a barra negativa ao contrário.
 */
function DataEndBar(props: { x?: number; y?: number; width?: number; height?: number; fill?: string; fillOpacity?: number; payload?: { profitDay: number } }) {
  const { x = 0, width = 0, fill, fillOpacity } = props;
  let { y = 0, height = 0 } = props;
  if (height < 0) {
    y += height;
    height = -height;
  }
  const r = Math.min(4, width / 2, height);
  const up = (props.payload?.profitDay ?? 0) >= 0;
  const d = up
    ? `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`
    : `M${x},${y} V${y + height - r} Q${x},${y + height} ${x + r},${y + height} H${x + width - r} Q${x + width},${y + height} ${x + width},${y + height - r} V${y} Z`;
  return <path d={d} fill={fill} fillOpacity={fillOpacity} />;
}

/**
 * Faixa sombreada atrás da barra apontada. O cursor padrão cobre a categoria
 * inteira: com poucos dias no período virava um bloco largo. Aqui fica no
 * máximo 40px, centrada na barra.
 */
function BarCursor(props: { x?: number; y?: number; width?: number; height?: number }) {
  const { x = 0, y = 0, width = 0, height = 0 } = props;
  const w = Math.min(width, 40);
  return <rect x={x + (width - w) / 2} y={y} width={w} height={height} rx={6} fill="var(--color-text)" fillOpacity={0.05} />;
}

// Variavel do tema: no claro o verde/vermelho escurecem pra ler no branco.
const POS = "var(--color-success)";
const NEG = "var(--color-danger)";
// Até 30 dias cabe tudo na tela. Acima disso a barra afinaria demais pra tocar:
// ela fica em 13px e o gráfico rola na horizontal, com o eixo Y parado.
const MAX_SEM_ROLAGEM = 30;
const SLOT = 22;
const Y_WIDTH = 40;
const cor = (v: number) => (v > 0 ? POS : v < 0 ? NEG : "var(--color-muted)");

/**
 * Lucro por dia. A leitura fica numa caixa acima das barras, que abre no
 * melhor dia do período (o que o olho procura primeiro); com `tooltip`, vira
 * um tooltip que segue o ponteiro e as outras barras recuam.
 */
export function ProfitBarChart({ data, height = 180, semanal = false, tooltip = false }: ProfitBarChartProps) {
  const melhor = data.reduce((m, d, i) => (d.profitDay > data[m].profitDay ? i : m), 0);
  const pior = data.reduce((m, d, i) => (d.profitDay < data[m].profitDay ? i : m), 0);
  const [sel, setSel] = useState(melhor);
  // No modo tooltip, com o ponteiro em cima as outras barras recuam.
  const [hovering, setHovering] = useState(false);
  const rola = data.length > MAX_SEM_ROLAGEM;
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setSel(melhor);
    // Abre com o dia em destaque centralizado, pra leitura e barra baterem.
    const el = scroller.current;
    if (el) el.scrollLeft = melhor * SLOT - el.clientWidth / 2;
  }, [data, melhor]);

  if (!data.length) return null;
  const atual = data[Math.min(sel, data.length - 1)];
  const unidade = semanal ? "semana" : "dia";
  const nota = sel === melhor && atual.profitDay > 0
    ? `melhor ${unidade} do período`
    : sel === pior && atual.profitDay < 0 ? `pior ${unidade} do período` : "";
  const ticks = data.length > 2
    ? [data[0].date, data[Math.floor(data.length / 2)].date, data[data.length - 1].date]
    : data.map((d) => d.date);
  const valores = data.map((d) => d.profitDay);
  // Passo "redondo" (1/2/2,5/5 x 10^n): com o dominio no min/max exato o eixo
  // mostrava 707,1 / 129,3 / -170,7.
  const lo = Math.min(0, ...valores);
  const hi = Math.max(0, ...valores);
  const bruto = (hi - lo) / 4 || 1;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= bruto)!;
  const domain: [number, number] = [Math.floor(lo / passo) * passo, Math.ceil(hi / passo) * passo];
  const yTicks: number[] = [];
  for (let v = domain[0]; v <= domain[1] + passo / 2; v += passo) yTicks.push(Math.round(v * 100) / 100);
  const eixoY = (
    <YAxis
      width={Y_WIDTH}
      domain={domain}
      ticks={yTicks}
      axisLine={false}
      tickLine={false}
      tick={AXIS_TICK}
      tickFormatter={compactAxis}
    />
  );
  const mover = (e: { activeTooltipIndex?: number } | null) => {
    if (e?.activeTooltipIndex == null) return;
    setSel(e.activeTooltipIndex);
    setHovering(true);
  };
  const dim = tooltip && hovering;

  return (
    <div>
      {!tooltip && <div className="mb-3 flex items-center justify-between rounded-xl bg-foreground/[0.04] px-3 py-2.5 text-sm">
        <span className="flex items-center gap-2.5">
          <span className="text-zinc-100">{semanal && "semana de "}{formatDayMonth(atual.date)}</span>
          <span className="h-4 w-px bg-foreground/10" />
          <span className="tabular-nums" style={{ color: cor(atual.profitDay) }}>
            {formatMoney(atual.profitDay, { signed: true })}
          </span>
        </span>
        {(nota || rola) && (
          <span className="flex items-center gap-1.5 text-zinc-500">
            {/* Com rolagem, "do período" sai pra caber a dica de arrastar. */}
            {rola ? nota.replace(" do período", "") : nota}
            {rola && <ArrowsHorizontal size={14} aria-label="arraste" />}
          </span>
        )}
      </div>}

      <div className="flex" style={{ height }}>
        {rola && (
          <div style={{ width: Y_WIDTH }} className="shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 24 }}>
                {eixoY}
                <Bar dataKey="profitDay" fill="transparent" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div ref={scroller} className={`min-w-0 flex-1 ${rola ? "overflow-x-auto overscroll-x-contain [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]" : ""}`}>
        <div style={{ height: "100%", minWidth: rola ? data.length * SLOT : undefined }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="25%"
            onMouseMove={mover}
            onClick={mover}
            onMouseLeave={() => setHovering(false)}
          >
            <CartesianGrid {...GRID_PROPS} />
            {rola ? <YAxis hide domain={domain} ticks={yTicks} /> : eixoY}
            <XAxis
              dataKey="date"
              ticks={height > 220 || rola ? undefined : ticks}
              height={24}
              minTickGap={rola ? 40 : 24}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={(v) => format(parseISO(v), "d MMM", { locale: ptBR })}
            />
            <ReferenceLine y={0} stroke="var(--color-text)" strokeOpacity={0.22} />
            {!tooltip && <ReferenceLine x={atual.date} stroke="var(--color-text)" strokeOpacity={0.35} />}
            {tooltip && (
              <Tooltip
                cursor={<BarCursor />}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as { date: string; profitDay: number };
                  return (
                    <ChartTooltipBox
                      title={`${semanal ? "Semana de " : ""}${formatDayMonth(p.date)}`}
                      rows={[{ label: semanal ? "Lucro da semana" : "Lucro do dia", value: formatMoney(p.profitDay, { signed: true }), color: p.profitDay ? cor(p.profitDay) : undefined }]}
                    />
                  );
                }}
              />
            )}
            <Bar
              dataKey="profitDay"
              maxBarSize={tooltip ? 22 : 14}
              barSize={rola ? 13 : undefined}
              minPointSize={2}
              shape={(props: unknown) => <DataEndBar {...(props as object)} />}
              animationDuration={650}
              animationEasing="ease-out"
            >
              {data.map((d, i) => (
                <Cell key={d.date} fill={cor(d.profitDay)} fillOpacity={dim && i !== sel ? 0.4 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
        </div>
      </div>
    </div>
  );
}
