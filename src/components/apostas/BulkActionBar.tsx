import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, X, HourglassMedium, CaretDown } from "@phosphor-icons/react";
import { ResultIdEnum } from "@/api/routes/get-bets";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  count: number;
  loading: boolean;
  onSetStatus: (resultId: ResultIdEnum) => void;
  onCancel: () => void;
}

const statusButtons = [
  { resultId: ResultIdEnum.WON, label: "Marcar como Ganha", icon: Check, className: "text-positive hover:bg-positive/10" },
  { resultId: ResultIdEnum.LOST, label: "Marcar como Perdida", icon: X, className: "text-negative hover:bg-negative/10" },
  { resultId: ResultIdEnum.PENDING, label: "Marcar como Pendente", icon: HourglassMedium, className: "text-amber-400 hover:bg-amber-400/10" },
];

export function BulkActionBar({ count, loading, onSetStatus, onCancel }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Ações em lote"
      className={cn(
        "fixed z-50 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200",
        "inset-x-0 bottom-0 justify-between px-4 py-3 bg-card border-t border-border",
        "md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:justify-normal md:rounded-xl md:border md:px-4 md:py-2.5",
        "md:bg-card/90 md:backdrop-blur-md"
      )}
      style={{ boxShadow: "var(--shadow-lg)" }}
    >
      <span aria-live="polite" className="text-[13px] font-medium shrink-0">
        {count} selecionada{count === 1 ? "" : "s"}
      </span>

      <div className="hidden sm:flex items-center gap-1.5">
        {statusButtons.map((b) => (
          <button
            key={b.resultId}
            type="button"
            disabled={loading}
            onClick={() => onSetStatus(b.resultId)}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-45 disabled:pointer-events-none", b.className)}
          >
            <b.icon size={14} /> {b.label}
          </button>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={loading}
            className="sm:hidden flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium bg-foreground/[0.08] disabled:opacity-45"
          >
            Alterar status <CaretDown size={12} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {statusButtons.map((b) => (
            <DropdownMenuItem key={b.resultId} onClick={() => onSetStatus(b.resultId)} className={b.className}>
              <b.icon size={14} className="mr-2" /> {b.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading} className="shrink-0">
        Cancelar
      </Button>
    </div>
  );
}
