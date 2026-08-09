import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs opacity-70">Casa de aposta</Label>
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

      <div className="space-y-1">
        <Label className="text-xs opacity-70">De</Label>
        <Input type="date" value={startDate} onChange={(e) => onCustomRange(e.target.value, endDate)} className="w-[150px]" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs opacity-70">Até</Label>
        <Input type="date" value={endDate} onChange={(e) => onCustomRange(startDate, e.target.value)} className="w-[150px]" />
      </div>
    </div>
  );
}
