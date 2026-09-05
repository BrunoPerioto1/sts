import { ArrowClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  distance: number;
  refreshing: boolean;
}

/**
 * Faixa que desce do topo enquanto o dedo puxa a tela (ver usePullToRefresh).
 * A seta gira proporcional ao arrasto e vira spinner quando o refetch começa.
 */
export function PullToRefreshIndicator({ distance, refreshing }: PullToRefreshIndicatorProps) {
  if (distance === 0 && !refreshing) return null;

  return (
    <div
      className="sm:hidden fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none"
      style={{ transform: `translateY(${Math.max(distance - 28, 4)}px)` }}
      aria-hidden
    >
      <span
        className="h-8 w-8 rounded-full bg-card flex items-center justify-center text-accent"
        style={{ boxShadow: "var(--shadow-sm)", opacity: Math.min(distance / 48, 1) || 1 }}
      >
        <ArrowClockwise
          size={16}
          className={cn(refreshing && "animate-spin")}
          style={refreshing ? undefined : { transform: `rotate(${distance * 4}deg)` }}
        />
      </span>
    </div>
  );
}
