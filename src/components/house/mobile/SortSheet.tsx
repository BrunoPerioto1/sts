import { BottomSheet } from "@/components/apostas/BottomSheet";
import { OptionRow } from "@/components/apostas/OptionRow";
import { Button } from "@/components/ui/button";

export type HouseSortMobile = "balance" | "profit" | "name" | "bets" | "lastMovement";

const OPTIONS: { value: HouseSortMobile; label: string; subtitle: string }[] = [
  { value: "balance", label: "Saldo", subtitle: "maior saldo primeiro" },
  { value: "profit", label: "Lucro", subtitle: "melhor desempenho primeiro" },
  { value: "name", label: "Nome", subtitle: "A → Z" },
  { value: "bets", label: "Apostas", subtitle: "mais movimentadas primeiro" },
  { value: "lastMovement", label: "Última movimentação", subtitle: "mais recente primeiro" },
];

interface SortSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: HouseSortMobile;
  onChange: (value: HouseSortMobile) => void;
}

export function SortSheet({ open, onOpenChange, value, onChange }: SortSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Ordenar por"
      footer={
        <Button variant="outline" className="w-full min-h-[44px]" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      }
    >
      <div className="flex flex-col gap-1 py-2">
        {OPTIONS.map((opt) => (
          <OptionRow
            key={opt.value}
            label={opt.label}
            subtitle={opt.subtitle}
            selected={value === opt.value}
            onToggle={() => {
              onChange(opt.value);
              onOpenChange(false);
            }}
          />
        ))}
      </div>
    </BottomSheet>
  );
}
