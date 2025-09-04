import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Filter } from "lucide-react";

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
  className?: string;
}

export function DateRangeFilter({ onDateRangeChange, className }: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleApplyFilter = () => {
    const start = startDate ? new Date(startDate).toISOString() : null;
    const end = endDate ? new Date(endDate).toISOString() : null;
    onDateRangeChange(start, end);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    onDateRangeChange(null, null);
  };

  const handleQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    onDateRangeChange(start.toISOString(), end.toISOString());
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Filtrar por Período</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter(7)}
        >
          Últimos 7 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter(30)}
        >
          Últimos 30 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter(90)}
        >
          Últimos 90 dias
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleApplyFilter}
          className="flex items-center gap-2"
          disabled={!startDate && !endDate}
        >
          <Filter className="h-4 w-4" />
          Aplicar Filtro
        </Button>
        
        <Button
          variant="outline"
          onClick={handleClearFilter}
          disabled={!startDate && !endDate}
        >
          Limpar
        </Button>
      </div>
    </div>
  );
}
