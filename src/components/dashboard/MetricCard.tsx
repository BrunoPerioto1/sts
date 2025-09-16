import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  icon,
  subtext,
  valueClass = "",
  className,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
  valueClass?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-lg transition-all",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-md bg-muted/40">{icon}</div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <p className={cn("text-2xl font-bold", valueClass)}>{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}