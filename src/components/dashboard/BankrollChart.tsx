import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";

export interface BankrollPoint {
  date: string;
  balance: number;
}

function BankrollTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-md border border-border bg-card p-[8px_10px] shadow-md text-xs">
      <p className="opacity-70 mb-1">{format(parseISO(label), "dd 'de' MMMM", { locale: ptBR })}</p>
      <span className="font-medium">{formatCurrency(payload[0].value)}</span>
    </div>
  );
}

/** Linha fina + preenchimento fraco: o protagonismo fica no dado, não no efeito. */
export function BankrollChart({ data, height = 260 }: { data: BankrollPoint[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 6, bottom: 0 }}>
          <defs>
            <linearGradient id="bankroll-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-2)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--color-accent-2)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-divider)" strokeOpacity={0.5} strokeDasharray="3 4" />
          <YAxis
            width={58}
            tickCount={3}
            axisLine={false}
            tickLine={false}
            domain={["dataMin", "dataMax"]}
            tick={{ fill: "var(--color-text)", opacity: 0.6, fontSize: 11 }}
            tickFormatter={(value: number) => formatCurrencyCompact(value)}
          />
          <XAxis
            dataKey="date"
            stroke="var(--color-text)"
            opacity={0.6}
            fontSize={11}
            minTickGap={40}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => format(parseISO(value), "d MMM", { locale: ptBR })}
          />
          <Tooltip content={<BankrollTooltip />} cursor={{ stroke: "var(--color-divider)" }} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--color-accent-2)"
            strokeWidth={1.5}
            fill="url(#bankroll-fill)"
            animationDuration={650}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
