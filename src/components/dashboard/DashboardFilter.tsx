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
    <div className="flex flex-wrap items-end gap-5">
      <div>
        <Label className={fieldLabelClass}>Casa de aposta</Label>
        <Select value={houseId ? houseId.toString() : "all"} onValueChange={(v) => onHouseChange(v === "all" ? undefined : Number(v))}>
          <SelectTrigger className="w-[180px]">
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

      <div>
        <Label className={fieldLabelClass}>De</Label>
        <DateField value={startDate} onChange={(v) => onCustomRange(v, endDate)} className="w-[150px]" />
      </div>
      <div>
        <Label className={fieldLabelClass}>Até</Label>
        <DateField value={endDate} onChange={(v) => onCustomRange(startDate, v)} className="w-[150px]" />
      </div>
    </div>
  );
}
