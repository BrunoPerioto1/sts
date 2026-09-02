import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardFilterProps {
  houses: { id: number; name: string }[];
  houseId?: number;
  onHouseChange: (houseId?: number) => void;
}

export function DashboardFilter({ houses, houseId, onHouseChange }: DashboardFilterProps) {
  return (
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
  );
}
