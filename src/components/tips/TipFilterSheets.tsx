import { BottomSheet } from "@/components/apostas/BottomSheet";
import { OptionRow } from "@/components/apostas/OptionRow";
import { Button } from "@/components/ui/button";
import type { TipStatus } from "@/api/routes/get-tips";

// Sheets dos filtros de Tips no mobile, no mesmo padrão do CasaSheet (bottom
// sheet com OptionRow), pra os três chips abrirem a mesma coisa.

interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
  description?: string;
}

const countLabel = (count?: number) =>
  count == null ? undefined : `${count} ${count === 1 ? "tip" : "tips"}`;

/** Status é a visão da página: seleção única, tocar já aplica e fecha. */
export function TipStatusSheet({
  open,
  onOpenChange,
  value,
  onChange,
  options,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: TipStatus;
  onChange: (value: TipStatus) => void;
  options: Option<TipStatus>[];
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Status">
      <div className="flex flex-col gap-0.5 py-2">
        {options.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            subtitle={o.description}
            count={o.count}
            selected={o.value === value}
            onToggle={() => {
              onChange(o.value);
              onOpenChange(false);
            }}
          />
        ))}
      </div>
    </BottomSheet>
  );
}

/** Início soma blocos (a iniciar + sem horário, por ex.): multi com Aplicar. */
export function TipInicioSheet({
  open,
  onOpenChange,
  selected,
  onChange,
  options,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string[];
  onChange: (next: string[]) => void;
  options: Option<string>[];
}) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const total = options.reduce((sum, o) => sum + (o.count ?? 0), 0);
  const filtradas = options.reduce((sum, o) => sum + (selected.includes(o.value) ? o.count ?? 0 : 0), 0);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filtrar por início"
      footer={
        <Button className="min-h-[44px] w-full" onClick={() => onOpenChange(false)}>
          {selected.length > 0 ? `Aplicar · ${countLabel(filtradas)}` : "Aplicar filtro"}
        </Button>
      }
    >
      <div className="flex flex-col gap-0.5 py-2">
        {/* "Todos" é o atalho de limpar: marcado enquanto nada está selecionado. */}
        <OptionRow
          label="Todos"
          subtitle="Todas as tips pendentes"
          count={total}
          multi
          selected={selected.length === 0}
          onToggle={() => onChange([])}
        />
        <div className="my-1 h-px bg-foreground/[0.06]" />
        {options.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            subtitle={o.description}
            count={o.count}
            multi
            selected={selected.includes(o.value)}
            onToggle={() => toggle(o.value)}
          />
        ))}
      </div>
    </BottomSheet>
  );
}
