import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";

// Variavel do tema: no claro o verde/vermelho escurecem pra ler no branco.
const POS = "rgb(var(--rgb-positive))";
const NEG = "rgb(var(--rgb-negative))";

/** Lucro acumulado dia a dia: a leitura mostra o dia tocado e o total até ele. */
export function CumulativeProfitChart({ data, height = 200 }: { data: { date: string; profitDay: number }[]; height?: number }) {
  const pontos = useMemo(() => {
    let acc = 0;
    return data.map((d) => ({ date: d.date, dia: d.profitDay, acum: (acc += d.profitDay) }));
  }, [data]);
  const [sel, setSel] = useState(pontos.length - 1);
  useEffect(() => setSel(pontos.length - 1), [pontos]);

  if (!pontos.length) return null;
  const atual = pontos[Math.min(sel, pontos.length - 1)];
  const linha = pontos[pontos.length - 1].acum >= 0 ? POS : NEG;
  const ticks = pontos.length > 2
    ? [pontos[0].date, pontos[Math.floor(pontos.length / 2)].date, pontos[pontos.length - 1].date]
    : pontos.map((p) => p.date);
  const mover = (e: { activeTooltipIndex?: number } | null) =>
    e?.activeTooltipIndex != null && setSel(e.activeTooltipIndex);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between rounded-xl bg-foreground/[0.04] px-3 py-2.5 text-sm">
        <span className="flex items-center gap-2.5">
          <span className="text-zinc-400">{format(parseISO(atual.date), "d MMM", { locale: ptBR })}</span>
          <span className="h-4 w-px bg-foreground/10" />
          <span className="text-zinc-400">
            Acum. <span className="font-medium tabular-nums text-zinc-100">{formatCurrency(atual.acum)}</span>
          </span>
        </span>
        <span className="tabular-nums" style={{ color: atual.dia >= 0 ? POS : NEG }}>
          {formatSignedCurrency(atual.dia)}
        </span>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={pontos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} onMouseMove={mover} onClick={mover}>
            <defs>
              <linearGradient id="acum-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={linha} stopOpacity={0.22} />
                <stop offset="100%" stopColor={linha} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-divider)" strokeOpacity={0.18} />
            <YAxis
              width={40}
              tickCount={3}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-text)", opacity: 0.5, fontSize: 10 }}
              tickFormatter={(v: number) => v.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 2 })}
            />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-text)", opacity: 0.5, fontSize: 10 }}
              tickFormatter={(v) => format(parseISO(v), "d MMM", { locale: ptBR })}
            />
            <ReferenceLine x={atual.date} stroke="var(--color-text)" strokeOpacity={0.35} strokeDasharray="3 3" />
            <Area type="monotone" dataKey="acum" stroke={linha} strokeWidth={2} fill="url(#acum-fill)" animationDuration={650} />
            <ReferenceDot x={atual.date} y={atual.acum} r={5} fill="var(--color-bg, #0a0a0a)" stroke={linha} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
