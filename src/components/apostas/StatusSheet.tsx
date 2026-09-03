import { BottomSheet } from "./BottomSheet";
import { OptionRow, OptionBar } from "./OptionRow";
import { STATUS_OPTIONS } from "./StatusMultiSelect";
import { Button } from "@/components/ui/button";

interface StatusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string[];
  onChange: (next: string[]) => void;
}

// Edita direto o rascunho do MobileFiltersSheet (mesmo array `selected`) —
// "Aplicar" aqui só fecha o sheet e volta pro Filtros, sem um segundo commit.
export function StatusSheet({ open, onOpenChange, selected, onChange }: StatusSheetProps) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <BottomSheet
      nested
      open={open}
      onOpenChange={onOpenChange}
      title="Status"
      titleExtra={
        selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[13px] text-zinc-400 hover:text-white min-h-[44px] px-1"
          >
            Limpar
          </button>
        )
      }
      footer={
        <Button className="w-full min-h-[44px]" onClick={() => onOpenChange(false)}>
          {selected.length > 0 ? `Aplicar · ${selected.length} status` : "Aplicar"}
        </Button>
      }
    >
      <div className="flex flex-col gap-1 py-2">
        {STATUS_OPTIONS.map((opt) => (
          <OptionRow
            key={opt.value}
            leading={<OptionBar color={opt.color} />}
            label={opt.label}
            selected={selected.includes(opt.value)}
            onToggle={() => toggle(opt.value)}
          />
        ))}
      </div>
    </BottomSheet>
  );
}
