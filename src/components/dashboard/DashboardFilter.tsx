import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FilterX, RefreshCw } from "lucide-react";

interface DashboardFilterProps {
  onFilterChange: (filters: { houseId?: number; startDate: string; endDate: string }) => void;
  onRefresh: () => void;
  houses: { id: number; name: string }[];
  loading: boolean;
}

export function DashboardFilter({ onFilterChange, onRefresh, houses, loading }: DashboardFilterProps) {
  const [houseId, setHouseId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    // Aplica o filtro automaticamente quando qualquer um dos valores muda
    onFilterChange({
      houseId: houseId === "all" ? undefined : Number(houseId),
      startDate: startDate,
      endDate: endDate,
    });
  }, [houseId, startDate, endDate, onFilterChange]);

  const handleClearFilter = () => {
    setHouseId("all");
    setStartDate("");
    setEndDate("");
  };

  const isFilterActive = houseId !== "all" || startDate !== "" || endDate !== "";

  return (
    <div className="flex items-end gap-4 p-4 border-b">
      <div className="flex-1 space-y-2">
        <Label>Casa de Aposta</Label>
        <Select 
          value={houseId} 
          onValueChange={setHouseId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas as casas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as casas</SelectItem>
            {houses.map(casa => (
              <SelectItem key={casa.id} value={casa.id.toString()}>
                {casa.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Data de Início</Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          max={endDate || undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">Data de Fim</Label>
        <Input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate || undefined}
        />
      </div>

      <div className="flex items-end gap-2">
        <Button
          onClick={handleClearFilter}
          disabled={!isFilterActive}
          className="flex items-center"
        >
          <FilterX className={`h-4 w-4 text-white`} />
        </Button>
        <Button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 text-white ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
