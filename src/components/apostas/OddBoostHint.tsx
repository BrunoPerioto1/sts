import { TrendingUp } from "lucide-react";

interface OddBoostHintProps {
  originalOdd: number | null;
}

/** "3.65 ↗ boost": a odd riscada só aparece quando o bilhete tinha boost. */
export function OddBoostHint({ originalOdd }: OddBoostHintProps) {
  if (originalOdd === null) return null;
  return (
    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1.5">
      <span className="text-[11px] tabular-nums text-zinc-500 line-through">
        {originalOdd.toFixed(2)}
      </span>
      <span className="inline-flex items-center gap-0.5 rounded-md bg-positive/15 px-1.5 py-0.5 text-[10px] font-medium text-positive">
        <TrendingUp className="h-2.5 w-2.5" />
        boost
      </span>
    </span>
  );
}
