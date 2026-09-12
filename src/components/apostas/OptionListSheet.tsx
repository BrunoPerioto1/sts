import { BottomSheet } from "./BottomSheet";
import { OptionRow } from "./OptionRow";
import { Button } from "@/components/ui/button";
import type { FilterOption } from "@/components/ui/option-multi-select";

interface OptionListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: FilterOption[];
  selected: number[];
  onChange: (next: number[]) => void;
  /** Plural do rodapé ("3 esportes"). */
  countLabel?: string;
  /** false quando o sheet abre direto da tela, sem outro sheet por baixo. */
  nested?: boolean;
}

// Lista simples de seleção múltipla pro mobile (esportes). As casas têm o
// CasaSheet próprio, com avatar, recentes e contagem de apostas — aqui a
// lista é curta e o nome basta.
export function OptionListSheet({
  open,
  onOpenChange,
  title,
  options,
  selected,
  onChange,
  countLabel,
  nested = true,
}: OptionListSheetProps) {
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);

  return (
    <BottomSheet
      nested={nested}
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      titleExtra={
        selected.length > 0 && (
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
        <Button className="w-full min-h-[44px]" onClick={() => onOpenChange(false)}>
          {selected.length > 0
            ? `Aplicar · ${selected.length} ${countLabel ?? title.toLowerCase()}`
            : "Aplicar"}
        </Button>
      }
    >
      <div className="flex flex-col gap-1 py-2">
        {options.map((o) => (
          <OptionRow
            key={o.id}
            label={o.name}
            selected={selected.includes(o.id)}
            onToggle={() => toggle(o.id)}
          />
        ))}
        {options.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-500">Nenhum esporte cadastrado.</p>
        )}
      </div>
    </BottomSheet>
  );
}
