import { ClockCounterClockwise, ListBullets, PlusCircle } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { formatCurrency } from "@/lib/format";

interface HouseActionsSheetProps {
  house: HouseBalanceDto | null;
  onClose: () => void;
  onNewTransaction: (house: HouseBalanceDto) => void;
  onViewBets: (house: HouseBalanceDto) => void;
  onOpenHistory: (house: HouseBalanceDto) => void;
}

// Menu de contexto rápido de uma casa, aberto por toque longo na linha da
// lista — mesma função do DropdownMenu do desktop, só que como sheet mobile.
// Sem editar/excluir casa: o usuário não cadastra casas, só movimenta.
export function HouseActionsSheet({ house, onClose, onNewTransaction, onViewBets, onOpenHistory }: HouseActionsSheetProps) {
  if (!house) return null;

  const rows = [
    { icon: PlusCircle, label: "Nova movimentação", onClick: () => onNewTransaction(house) },
    { icon: ListBullets, label: "Ver apostas", onClick: () => onViewBets(house) },
    { icon: ClockCounterClockwise, label: "Histórico de movimentações", onClick: () => onOpenHistory(house) },
  ];

  return (
    <BottomSheet
      open={!!house}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={house.houseName}
      footer={
        <Button variant="outline" className="w-full min-h-[44px]" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="pb-4">
        <p className="text-sm text-zinc-500 -mt-1 mb-2">
          {formatCurrency(Number(house.houseBalance))} · {house.totalBets} aposta{Number(house.totalBets) === 1 ? "" : "s"}
        </p>

        <div className="flex flex-col gap-1">
          {rows.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={r.onClick}
              className="press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left hover:bg-white/[0.04]"
            >
              <r.icon size={18} className="text-accent shrink-0" />
              <span className="text-sm text-white">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
