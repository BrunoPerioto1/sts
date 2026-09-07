import { cn } from "@/lib/utils";
import { ResultIdEnum } from "@/api/routes/get-bets";

const pills: { label: string; value: string[] }[] = [
  { label: "Todas", value: [] },
  { label: "Ganhas", value: [String(ResultIdEnum.WON)] },
  { label: "Pendentes", value: [String(ResultIdEnum.PENDING)] },
  { label: "Perdidas", value: [String(ResultIdEnum.LOST)] },
];

// Chips de status rápido — só mobile, substitui o multi-select da toolbar desktop.
export function MobileStatusPills({ value, onChange }: { value: string[]; onChange: (status: string[]) => void }) {
  return (
    <div className="flex md:hidden gap-2 overflow-x-auto pb-3 -mx-4 px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {pills.map((pill) => {
        const isActive = pill.value.length === 0 ? value.length === 0 : value.length === 1 && value[0] === pill.value[0];
        return (
          <button
            key={pill.label}
            aria-pressed={isActive}
            type="button"
            onClick={() => onChange(pill.value)}
            className={cn(
              "shrink-0 h-11 px-3.5 rounded-full text-sm font-medium transition-colors",
              isActive ? "bg-accent text-white" : "border border-white/10 bg-transparent text-zinc-400"
            )}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
