import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export function MetricCard({
  title,
  value,
  icon,
  subtext,
  valueClass = "",
  className,
  sparkline,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
  valueClass?: string;
  className?: string;
  sparkline?: number[];
}) {
  return (
    <div className={cn("card elev-sm bg-card rounded-md p-[12px_14px] sm:p-[14px_16px] flex flex-col gap-2 min-w-0", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent">
          {icon}
          <h4 className="text-[10px] uppercase tracking-wide sm:tracking-widest opacity-70">{title}</h4>
        </div>
        {sparkline && sparkline.length > 0 && (
          <div className="w-[50px] h-[26px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sparkline.map((v) => ({ v }))} barCategoryGap={2}>
                <Bar dataKey="v" radius={[1.5, 1.5, 1.5, 1.5]}>
                  {sparkline.map((v, i) => (
                    <Cell key={i} fill={v >= 0 ? "#4ade9e" : "#f0797e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <p
        className={cn("text-[19px] sm:text-[27px] font-medium tabular-nums whitespace-nowrap", valueClass)}
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
      {subtext && <p className="text-[11.5px] opacity-45">{subtext}</p>}
    </div>
  );
}
