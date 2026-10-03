import { CaretDown } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS } from "@/lib/bet-status";

interface StatusMultiSelectProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  disabled?: boolean;
  // Reaproveitado pelo filtro de origem: mesma caixa, outras opções.
  options?: readonly { value: string; label: string }[];
  label?: string;
  // Singular/plural do resumo, como no HouseMultiSelect.
  noun?: [string, string];
  allLabel?: string;
  /**
   * Filtro de outra natureza no mesmo menu (ex.: "Sem jogo identificado" na
   * origem, que não é origem). Com ele, as duas listas ganham rótulo de seção.
   */
  extra?: { section: string; label: string; checked: boolean; onToggle: () => void };
}

const sectionLabel = "px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500";

// Mesmo visual do HouseMultiSelect (Casas/Esportes), sem a busca: a lista é
// curta e fixa.
export function StatusMultiSelect({
  selected,
  onChange,
  className,
  disabled,
  options = STATUS_OPTIONS,
  label = "Status",
  noun = ["status", "status"],
  allLabel = "Todos",
  extra,
}: StatusMultiSelectProps) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const labels = [
    ...options.filter((o) => selected.includes(o.value)).map((o) => o.label),
    ...(extra?.checked ? [extra.label] : []),
  ];
  const summary =
    labels.length === 0 ? null : labels.length === 1 ? labels[0] : `${labels.length} ${noun[1]}`;
  const hasSelection = labels.length > 0;

  const row = (key: string, text: string, checked: boolean, onToggle: () => void) => (
    <label
      key={key}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-200 hover:bg-foreground/[0.03]"
    >
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <span className="truncate">{text}</span>
    </label>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 text-sm disabled:opacity-45 disabled:cursor-not-allowed",
            className
          )}
        >
          <span className="text-zinc-500 shrink-0">{label}</span>
          <span className={cn("truncate", summary ? "text-foreground" : "text-zinc-400")}>
            {summary ?? allLabel}
          </span>
          <CaretDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[220px] p-1.5">
        {extra && <p className={sectionLabel}>{label}</p>}
        {options.map((opt) => row(opt.value, opt.label, selected.includes(opt.value), () => toggle(opt.value)))}

        {extra && (
          <>
            <p className={cn(sectionLabel, "mt-2")}>{extra.section}</p>
            {row("extra", extra.label, extra.checked, extra.onToggle)}
          </>
        )}

        {hasSelection && (
          <button
            type="button"
            onClick={() => {
              onChange([]);
              if (extra?.checked) extra.onToggle();
            }}
            className="mt-1.5 w-full border-t border-foreground/10 pt-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Limpar seleção
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
