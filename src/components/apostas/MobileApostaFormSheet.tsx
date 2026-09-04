import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { SheetSelectField } from "./SheetSelectField";
import { CasaSheet } from "./CasaSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useApostaForm } from "@/hooks/apostas/useApostaForm";
import { type BetItem } from "@/api/routes/get-bets";

const fieldLabel = "text-xs font-medium uppercase tracking-wider text-zinc-500";

interface MobileApostaFormSheetProps {
  open: boolean;
  onClose: () => void;
  onApostaAdded: (aposta: BetItem) => void;
  initialData?: BetItem;
  isEditing?: boolean;
}

export function MobileApostaFormSheet({ open, onClose, onApostaAdded, initialData, isEditing = false }: MobileApostaFormSheetProps) {
  const [casaOpen, setCasaOpen] = useState(false);
  const { formData, setFormData, houses, submitting, potentialReturn, handleSubmit } = useApostaForm({
    onApostaAdded: (aposta) => {
      onApostaAdded(aposta);
      onClose();
    },
    initialData,
    isEditing,
  });

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={isEditing ? "Editar aposta" : "Nova aposta"}
      footer={
        <Button type="submit" form="mobile-aposta-form" disabled={submitting} className="w-full min-h-[44px]">
          {submitting ? "Salvando…" : isEditing ? "Atualizar aposta" : "Registrar aposta"}
        </Button>
      }
    >
      <form id="mobile-aposta-form" onSubmit={handleSubmit} className="flex flex-col gap-4 pb-4">
        <div className="space-y-1.5">
          <span className={fieldLabel}>Evento *</span>
          <Input
            placeholder="Ex: Palmeiras x Flamengo"
            value={formData.game}
            onChange={(e) => setFormData({ ...formData, game: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <span className={fieldLabel}>Mercado *</span>
          <Input
            placeholder="Ex: Mais de 2.5 gols"
            value={formData.market}
            onChange={(e) => setFormData({ ...formData, market: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className={fieldLabel}>Casa *</span>
            <SheetSelectField
              summary={formData.houseId ? (houses.find((h) => h.id === formData.houseId)?.name ?? "Selecionar") : "Selecionar"}
              onOpen={() => setCasaOpen(true)}
              className="min-h-[32px] sm:min-h-[36px]"
            />
          </div>
          <div className="space-y-1.5">
            <span className={fieldLabel}>Odd *</span>
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="Ex: 1,92"
              value={formData.odd}
              onChange={(e) => setFormData({ ...formData, odd: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className={fieldLabel}>Esporte</span>
            <Input
              placeholder="Ex: Futebol"
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <span className={fieldLabel}>Stake (R$) *</span>
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="Ex: 100,00"
              value={formData.stake}
              onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
            />
          </div>
        </div>

        {potentialReturn && (
          <div
            className="grid grid-cols-2 gap-3 rounded-md p-3"
            style={{ background: "var(--color-bg)", boxShadow: "inset 2px 0 0 var(--color-accent)" }}
          >
            <div>
              <p className={fieldLabel}>Retorno potencial</p>
              <p className="text-xl font-semibold tabular-nums text-white">{formatCurrency(potentialReturn.total)}</p>
            </div>
            <div>
              <p className={fieldLabel}>Lucro se ganhar</p>
              <p className="text-xl font-semibold tabular-nums text-positive">+{formatCurrency(potentialReturn.profit)}</p>
            </div>
          </div>
        )}
      </form>

      <CasaSheet
        multiple={false}
        open={casaOpen}
        onOpenChange={setCasaOpen}
        houses={houses}
        houseIds={formData.houseId ? [formData.houseId] : []}
        onChange={(ids) => setFormData({ ...formData, houseId: ids[0] })}
      />
    </BottomSheet>
  );
}
