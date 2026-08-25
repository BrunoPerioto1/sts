import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MagnifyingGlass, DownloadSimple, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ApostasFilterProps {
  houses: { id: number; name: string }[];
  onSearch: (term: string) => void;
  onFilterStatus?: (status: string) => void;
  onFilterHouse?: (houseId: string) => void;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  onClearFilters?: () => void;
  onExportCsv?: () => void;
  className?: string;
  isLoading?: boolean;
  initialDateFrom?: string;
  initialDateTo?: string;
}

const statusLabels: Record<string, string> = {
  "9": "Pendente",
  "1": "Ganha",
  "2": "Perdida",
  "3": "Cancelada",
  "4": "Meia Ganha",
  "5": "Meia Perdida",
  "6": "Cashout",
};

export function ApostasFilter({
  houses,
  onSearch,
  onFilterStatus,
  onFilterHouse,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  onExportCsv,
  className,
  isLoading = false,
  initialDateFrom = "",
  initialDateTo = "",
}: ApostasFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [status, setStatus] = useState("0");
  const [houseId, setHouseId] = useState("0");

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (searchTerm) activeChips.push({ key: "q", label: `Busca: ${searchTerm}`, clear: () => { setSearchTerm(""); onSearch(""); } });
  if (status !== "0") activeChips.push({ key: "status", label: statusLabels[status] ?? status, clear: () => { setStatus("0"); onFilterStatus?.("0"); } });
  if (houseId !== "0") {
    const houseName = houses.find((h) => h.id.toString() === houseId)?.name ?? houseId;
    activeChips.push({ key: "house", label: houseName, clear: () => { setHouseId("0"); onFilterHouse?.("0"); } });
  }
  if (dateFrom) activeChips.push({ key: "from", label: `De ${dateFrom}`, clear: () => { setDateFrom(""); onDateFromChange?.(""); } });
  if (dateTo) activeChips.push({ key: "to", label: `Até ${dateTo}`, clear: () => { setDateTo(""); onDateToChange?.(""); } });

  const handleClear = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setStatus("0");
    setHouseId("0");
    onClearFilters?.();
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-[280px]">
          <MagnifyingGlass size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 opacity-50" />
          <Input
            placeholder="Buscar apostas..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); onSearch(e.target.value); }}
            className="pl-8"
            disabled={isLoading}
          />
        </div>

        <DateField value={dateFrom} onChange={(v) => { setDateFrom(v); onDateFromChange?.(v); }} className="w-auto flex-1 min-w-[120px] sm:flex-none sm:w-[150px]" disabled={isLoading} />
        <DateField value={dateTo} onChange={(v) => { setDateTo(v); onDateToChange?.(v); }} className="w-auto flex-1 min-w-[120px] sm:flex-none sm:w-[150px]" disabled={isLoading} />

        <Select value={status} onValueChange={(v) => { setStatus(v); onFilterStatus?.(v); }} disabled={isLoading}>
          <SelectTrigger className="w-auto flex-1 min-w-[130px] sm:flex-none sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Todos os status</SelectItem>
            <SelectItem value="9">Pendente</SelectItem>
            <SelectItem value="1">Ganha</SelectItem>
            <SelectItem value="2">Perdida</SelectItem>
            <SelectItem value="4">Meia Ganha</SelectItem>
            <SelectItem value="5">Meia Perdida</SelectItem>
            <SelectItem value="6">Cashout</SelectItem>
            <SelectItem value="3">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={houseId} onValueChange={(v) => { setHouseId(v); onFilterHouse?.(v); }} disabled={isLoading}>
          <SelectTrigger className="w-auto flex-1 min-w-[130px] sm:flex-none sm:w-[160px]"><SelectValue placeholder="Casa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Todas as casas</SelectItem>
            {houses.map((h) => (
              <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onExportCsv && (
          <Button variant="ghost" size="sm" onClick={onExportCsv} className="w-full sm:w-auto sm:ml-auto gap-2">
            <DownloadSimple size={16} /> Exportar CSV
          </Button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] opacity-45">Filtros ativos</span>
          {activeChips.map((chip) => (
            <span key={chip.key} className="tag border border-accent text-accent inline-flex items-center gap-1 rounded-[6px] px-[10px] py-[3px] text-[11px]">
              {chip.label}
              <button onClick={chip.clear} aria-label="Remover filtro">
                <X size={11} />
              </button>
            </span>
          ))}
          <button onClick={handleClear} className="text-[11px] text-accent hover:underline">Limpar tudo</button>
        </div>
      )}
    </div>
  );
}
