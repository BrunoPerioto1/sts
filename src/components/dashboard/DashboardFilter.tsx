import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FilterX, RefreshCw } from "lucide-react";

interface DashboardFilterProps {
  onFilterChange: (filters: {
    houseId?: number;
    startDate: string;
    endDate: string;
  }) => void;
  onRefresh: () => void;
  houses: { id: number; name: string }[];
  loading: boolean;
  filters: {
    houseId?: number;
    startDate: string;
    endDate: string;
  };
}

export function DashboardFilter({ 
  onFilterChange, 
  onRefresh, 
  houses, 
  loading, 
  filters 
}: DashboardFilterProps) {
  
  const handleClearFilter = () => {
    onFilterChange({
      houseId: undefined,
      startDate: "",
      endDate: "",
    });
  };

  const handleHouseChange = (value: string) => {
    onFilterChange({
      ...filters,
      houseId: value === "all" ? undefined : Number(value),
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      startDate: e.target.value,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      endDate: e.target.value,
    });
  };

  const isFilterActive =
    filters.houseId !== undefined || 
    filters.startDate !== "" || 
    filters.endDate !== "";

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-4 p-4 border-b">
      {}
      <div className="space-y-2 w-full sm:w-52">
        <Label>Casa de Aposta</Label>
        <Select
          value={filters.houseId ? filters.houseId.toString() : "all"}
          onValueChange={handleHouseChange}
        >
          <SelectTrigger>
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

      {/* Data de Início */}
      <div className="space-y-2 w-full sm:w-auto">
        <Label htmlFor="startDate">Data de Início</Label>
        <Input
          id="startDate"
          type="date"
          value={filters.startDate}
          onChange={handleStartDateChange}
          max={filters.endDate || undefined}
          className="w-full sm:w-40"
        />
      </div>

      {/* Data de Fim */}
      <div className="space-y-2 w-full sm:w-auto">
        <Label htmlFor="endDate">Data de Fim</Label>
        <Input
          id="endDate"
          type="date"
          value={filters.endDate}
          onChange={handleEndDateChange}
          min={filters.startDate || undefined}
          className="w-full sm:w-40"
        />
      </div>

      {/* Botões de Ação */}
      <div className="flex items-end gap-2 w-full sm:w-auto">
        <Button
          onClick={handleClearFilter}
          disabled={!isFilterActive}
          variant="outline"
          size="icon"
          title="Limpar filtros"
        >
          <FilterX className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={onRefresh}
          disabled={loading}
          variant="outline"
          size="icon"
          title="Atualizar dados"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
}