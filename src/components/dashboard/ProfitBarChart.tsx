import { useEffect, useRef, useState } from "react";
import { ArrowsHorizontal } from "@phosphor-icons/react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatSignedCurrency } from "@/lib/format";

interface ProfitBarChartProps {
  data: { date: string; profitDay: number }[];
  height?: number;
}

// Variavel do tema: no claro o verde/vermelho escurecem pra ler no branco.
const POS = "rgb(var(--rgb-positive))";
const NEG = "rgb(var(--rgb-negative))";
// Até 30 dias cabe tudo na tela. Acima disso a barra afinaria demais pra tocar:
// ela fica em 13px e o gráfico rola na horizontal, com o eixo Y parado.
const MAX_SEM_ROLAGEM = 30;
const SLOT = 22;
const Y_WIDTH = 40;
const cor = (v: number) => (v > 0 ? POS : v < 0 ? NEG : "#71717a");

/**
 * Lucro por dia. A leitura fica numa caixa acima das barras (não em tooltip
 * flutuante); abre no melhor dia do período, que é o que o olho procura primeiro.
 */
export function ProfitBarChart({ data, height = 180 }: ProfitBarChartProps) {
  const melhor = data.reduce((m, d, i) => (d.profitDay > data[m].profitDay ? i : m), 0);
  const pior = data.reduce((m, d, i) => (d.profitDay < data[m].profitDay ? i : m), 0);
  const [sel, setSel] = useState(melhor);
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
  const nota = sel === melhor && atual.profitDay > 0
    ? "melhor dia do período"
    : sel === pior && atual.profitDay < 0 ? "pior dia do período" : "";
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
      tick={{ fill: "var(--color-text)", opacity: 0.5, fontSize: 10 }}
      tickFormatter={(v: number) => v.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })}
    />
  );
  const mover = (e: { activeTooltipIndex?: number } | null) =>
    e?.activeTooltipIndex != null && setSel(e.activeTooltipIndex);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between rounded-xl bg-foreground/[0.04] px-3 py-2.5 text-sm">
        <span className="flex items-center gap-2.5">
          <span className="text-zinc-100">{format(parseISO(atual.date), "d MMM", { locale: ptBR })}</span>
          <span className="h-4 w-px bg-foreground/10" />
          <span className="tabular-nums" style={{ color: cor(atual.profitDay) }}>
            {formatSignedCurrency(atual.profitDay)}
          </span>
        </span>
        {(nota || rola) && (
          <span className="flex items-center gap-1.5 text-zinc-500">
            {/* Com rolagem, "do período" sai pra caber a dica de arrastar. */}
            {rola ? nota.replace(" do período", "") : nota}
            {rola && <ArrowsHorizontal size={14} aria-label="arraste" />}
          </span>
        )}
      </div>

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
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="25%" onMouseMove={mover} onClick={mover}>
            <CartesianGrid vertical={false} stroke="var(--color-divider)" strokeOpacity={0.18} />
            {rola ? <YAxis hide domain={domain} ticks={yTicks} /> : eixoY}
            <XAxis
              dataKey="date"
              ticks={height > 220 || rola ? undefined : ticks}
              height={24}
              minTickGap={rola ? 40 : 24}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-text)", opacity: 0.5, fontSize: 10 }}
              tickFormatter={(v) => format(parseISO(v), "d MMM", { locale: ptBR })}
            />
            <ReferenceLine y={0} stroke="color-mix(in srgb, var(--color-text) 30%, transparent)" />
            <ReferenceLine x={atual.date} stroke="var(--color-text)" strokeOpacity={0.35} />
            <Bar dataKey="profitDay" maxBarSize={14} barSize={rola ? 13 : undefined} radius={[2, 2, 2, 2]} minPointSize={2} animationDuration={650} animationEasing="ease-out">
              {data.map((d) => (
                <Cell key={d.date} fill={cor(d.profitDay)} />
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
