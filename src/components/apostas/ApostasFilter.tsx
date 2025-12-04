import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApostasFilterProps {
  onSearch: (term: string) => void;
  onFilterStatus?: (status: string) => void;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  onClearFilters?: () => void;
  className?: string;
  isLoading?: boolean;
}

export function ApostasFilter({
  onSearch,
  onFilterStatus,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  className,
  isLoading = false
}: ApostasFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("0");

  const handleClear = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setStatus("0");
    onClearFilters?.();
    onSearch(""); // garante que o pai também resetará
    onFilterStatus?.("0");
    onDateFromChange?.("");
    onDateToChange?.("");
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Busca - sempre em linha completa */}
      <div className="space-y-2">
        <label htmlFor="search" className="text-sm font-medium">Buscar</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="search"
            placeholder="Buscar apostas..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); onSearch(e.target.value); }}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Filtros em grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Data Inicial</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); onDateFromChange?.(e.target.value); }}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Data Final</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); onDateToChange?.(e.target.value); }}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select 
            value={status}
            onValueChange={(value) => { setStatus(value); onFilterStatus?.(value); }} 
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todos</SelectItem>
              <SelectItem value="9">Pendente</SelectItem>
              <SelectItem value="1">Ganha</SelectItem>
              <SelectItem value="2">Perdida</SelectItem>
              <SelectItem value="3">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex flex-col justify-end">
          <Button 
            variant="outline" 
            onClick={handleClear} 
            disabled={isLoading}
            className="w-full"
          >
            Limpar Filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
