import { CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 20, className, label }: SpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 text-accent", className)}>
      <CircleNotch size={size} className="animate-spin" />
      {label && <span className="text-sm opacity-60">{label}</span>}
    </div>
  );
}
