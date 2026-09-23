import { BottomSheet } from "./BottomSheet";
import { OptionRow } from "./OptionRow";
import { SportIcon } from "./SportIcon";
import { Button } from "@/components/ui/button";
import type { SportDto } from "@/api/routes/get-bets";

interface SportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sports: SportDto[];
  selected: number[];
  onChange: (next: number[]) => void;
  // false = seleção única (form de aposta): tocar seleciona e fecha, sem
  // rodapé — mesmo contrato do CasaSheet.
  multiple?: boolean;
  nested?: boolean;
}

// Mesmo padrão do StatusSheet: no filtro edita o rascunho do
// MobileFiltersSheet e "Aplicar" só fecha. Lista curta, sem busca.
export function SportSheet({ open, onOpenChange, sports, selected, onChange, multiple = true, nested = true }: SportSheetProps) {
  const toggle = (id: number) => {
    if (!multiple) {
      onChange([id]);
      onOpenChange(false);
      return;
    }
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);
  };

  return (
    <BottomSheet
      nested={nested}
      open={open}
      onOpenChange={onOpenChange}
      title="Esporte"
      titleExtra={
        multiple && selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-sm text-zinc-400 hover:text-white min-h-[44px] px-1"
          >
            Limpar
          </button>
        )
      }
      footer={
        multiple ? (
          <Button className="w-full min-h-[44px]" onClick={() => onOpenChange(false)}>
            {selected.length > 0 ? `Aplicar · ${selected.length} ${selected.length === 1 ? "esporte" : "esportes"}` : "Aplicar"}
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-1 py-2">
        {sports.map((s) => (
          <OptionRow
            key={s.id}
            leading={
              <span className="h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center bg-white/[0.06] text-zinc-300">
                <SportIcon name={s.name} />
              </span>
            }
            label={s.name}
            selected={selected.includes(s.id)}
            onToggle={() => toggle(s.id)}
          />
        ))}
      </div>
    </BottomSheet>
  );
}
