import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApostasFilterProps {
  onSearch: (term: string) => void;
  onFilterStatus?: (status: string) => void;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function ApostasFilter({
  onSearch,
  onFilterStatus,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  className
}: ApostasFilterProps) {
  return (
    <div className={cn("flex items-end gap-4 w-full", className)}>
      <div className="flex-1 flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <label htmlFor="search" className="text-sm font-medium">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search"
              placeholder="Buscar apostas..."
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Data Inicial
          </label>
          <Input
            type="date"
            onChange={(e) => onDateFromChange?.(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Data Final
          </label>
          <Input
            type="date"
            onChange={(e) => onDateToChange?.(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Status
          </label>
          <Select onValueChange={value => onFilterStatus?.(value)} defaultValue="0">
            <SelectTrigger className="w-40">
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
      </div>

      <div className="flex items-center gap-2 pb-[2px]">
        <Button 
          variant="outline" 
          onClick={onClearFilters}
        >
          Limpar Filtros
        </Button>
        {/* Remova este botão, ele está duplicado em NovaApostaPage */}
        {/* <Button variant="default">Nova Aposta</Button> */}
      </div>
    </div>
  );
}