import type { HouseActivity } from "@/lib/house-activity";
import { cn } from "@/lib/utils";

const badge =
  "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 ring-1 ring-inset normal-case tracking-normal";

/**
 * Selo ao lado do nome da casa: "sacar" em amarelo quando a casa está parada
 * há mais de STALE_BET_DAYS com saldo, "sem apostas" neutro quando ela só
 * recebeu depósito. Casa ativa ou parada sem saldo não ganha selo.
 */
export function HouseActivityBadge({ activity }: { activity: HouseActivity }) {
  if (activity.kind === "withdraw") {
    return (
      <span
        className={cn(badge, "bg-amber-400/10 text-amber-400 ring-amber-400/25")}
        title={`Sem apostas há ${activity.days} dias — considere sacar o saldo`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        sacar · {activity.days}d parada
      </span>
    );
  }
  if (activity.kind === "never") {
    return <span className={cn(badge, "bg-foreground/[0.05] text-zinc-400 ring-foreground/10")}>sem apostas</span>;
  }
  return null;
}
