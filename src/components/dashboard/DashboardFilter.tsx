import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/ui/date-field";
import { Label } from "@/components/ui/label";

const fieldLabelClass = "block mb-2 text-xs opacity-70";

interface DashboardFilterProps {
  houses: { id: number; name: string }[];
  houseId?: number;
  onHouseChange: (houseId?: number) => void;
  startDate: string;
  endDate: string;
  onCustomRange: (startDate: string, endDate: string) => void;
}

export function DashboardFilter({ houses, houseId, onHouseChange, startDate, endDate, onCustomRange }: DashboardFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 sm:gap-5">
      <div className="w-full sm:w-[180px]">
        <Label className={fieldLabelClass}>Casa de aposta</Label>
        <Select value={houseId ? houseId.toString() : "all"} onValueChange={(v) => onHouseChange(v === "all" ? undefined : Number(v))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todas as casas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as casas</SelectItem>
            {houses.map((house) => (
              <SelectItem key={house.id} value={house.id.toString()}>
                {house.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[120px] sm:flex-none sm:w-[150px]">
        <Label className={fieldLabelClass}>De</Label>
        <DateField value={startDate} onChange={(v) => onCustomRange(v, endDate)} className="w-auto" />
      </div>
      <div className="flex-1 min-w-[120px] sm:flex-none sm:w-[150px]">
        <Label className={fieldLabelClass}>Até</Label>
        <DateField value={endDate} onChange={(v) => onCustomRange(startDate, v)} className="w-auto" />
      </div>
    </div>
  );
}
