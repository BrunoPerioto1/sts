import { FilterChips } from "@/components/ui/filter-chips";
import { ResultIdEnum } from "@/api/routes/get-bets";

type Pill = "all" | "won" | "pending" | "lost";

const pills: { value: Pill; label: string; status: string[] }[] = [
  { value: "all", label: "Todas", status: [] },
  { value: "won", label: "Ganhas", status: [String(ResultIdEnum.WON)] },
  { value: "pending", label: "Pendentes", status: [String(ResultIdEnum.PENDING)] },
  { value: "lost", label: "Perdidas", status: [String(ResultIdEnum.LOST)] },
];

// Chips de status rápido — só mobile, substitui o multi-select da toolbar
// desktop. Combinação que não é um chip (ex.: 2 status pelo sheet de filtros)
// deixa nenhum chip marcado.
export function MobileStatusPills({ value, onChange }: { value: string[]; onChange: (status: string[]) => void }) {
  const current =
    value.length === 0 ? "all" : value.length === 1 ? pills.find((p) => p.status[0] === value[0])?.value : undefined;
  return (
    <FilterChips
      className="md:hidden mb-2"
      options={pills}
      value={current as Pill}
      onChange={(next) => onChange(pills.find((p) => p.value === next)!.status)}
    />
  );
}
