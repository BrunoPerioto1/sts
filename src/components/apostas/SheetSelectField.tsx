import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SheetSelectFieldProps {
  summary: string;
  onOpen: () => void;
  className?: string;
}

// Campo "select" que, em vez de abrir um dropdown, abre um bottom sheet
// (Status/Casa) — usado dentro do MobileFiltersSheet.
export function SheetSelectField({ summary, onOpen, className }: SheetSelectFieldProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center justify-between gap-2 min-h-[44px] rounded-md border border-input bg-card px-[10px] py-[6px] text-sm hover:border-foreground/45 transition-colors",
        className
      )}
    >
      <span className="text-white truncate">{summary}</span>
      <CaretDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
    </button>
  );
}
