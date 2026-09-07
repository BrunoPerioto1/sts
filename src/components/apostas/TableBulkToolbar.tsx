import { Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResultIdEnum } from "@/api/routes/get-bets";

interface TableBulkToolbarProps {
  totalOnPage: number;
  selectedCount: number;
  disabled: boolean;
  onToggleAll: () => void;
  onChangeStatus: (resultId: number) => void;
  onDeleteSelected: () => void;
}

// Barra "Selecionar todas" + ações em lote da visão Tabela.
export function TableBulkToolbar({
  totalOnPage,
  selectedCount,
  disabled,
  onToggleAll,
  onChangeStatus,
  onDeleteSelected,
}: TableBulkToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selectedCount === totalOnPage && totalOnPage > 0}
          onCheckedChange={onToggleAll}
          disabled={disabled}
        />
        <label className="text-sm opacity-70">Selecionar todas</label>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2 ml-auto">
          <Select onValueChange={(v) => onChangeStatus(Number(v))} disabled={disabled}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Alterar status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={String(ResultIdEnum.PENDING)}>Pendente</SelectItem>
              <SelectItem value={String(ResultIdEnum.WON)}>Ganha</SelectItem>
              <SelectItem value={String(ResultIdEnum.LOST)}>Perdida</SelectItem>
              <SelectItem value={String(ResultIdEnum.HALF_WON)}>Meia Ganha</SelectItem>
              <SelectItem value={String(ResultIdEnum.HALF_LOST)}>Meia Perdida</SelectItem>
              <SelectItem value={String(ResultIdEnum.CANCELED)}>Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={onDeleteSelected} disabled={disabled} className="gap-2">
            <Trash size={14} /> Excluir selecionadas
          </Button>
        </div>
      )}
    </div>
  );
}
