import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { SheetSelectField } from "./SheetSelectField";
import { CasaSheet } from "./CasaSheet";
import { DataHoraSheet, formatDataHora } from "./DataHoraSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useApostaForm } from "@/hooks/apostas/use-aposta-form";
import { type BetItem } from "@/api/routes/get-bets";

const fieldLabel = "text-xs font-medium uppercase tracking-wider text-zinc-400";

interface MobileApostaFormSheetProps {
  open: boolean;
  onClose: () => void;
  onApostaAdded: (aposta: BetItem) => void;
  initialData?: BetItem;
  isEditing?: boolean;
}

export function MobileApostaFormSheet({ open, onClose, onApostaAdded, initialData, isEditing = false }: MobileApostaFormSheetProps) {
  const [casaOpen, setCasaOpen] = useState(false);
  const [dataHoraOpen, setDataHoraOpen] = useState(false);
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
          <label htmlFor="bet-game" className={fieldLabel}>Evento *</label>
          <Input
            placeholder="Ex: Palmeiras x Flamengo"
            id="bet-game"
              value={formData.game}
            onChange={(e) => setFormData({ ...formData, game: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="bet-market" className={fieldLabel}>Mercado *</label>
          <Input
            placeholder="Ex: Mais de 2.5 gols"
            id="bet-market"
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
              className="min-h-[44px] sm:min-h-[36px]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="bet-odd" className={fieldLabel}>Odd *</label>
            {/* type="text", não "number": com locale pt-BR o input numérico
                trata a vírgula como caractere inválido e zera o valor sem
                avisar — justamente o separador que o placeholder pede. */}
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 1,92"
              id="bet-odd"
              value={formData.odd}
              onChange={(e) => setFormData({ ...formData, odd: e.target.value })}
            />
          </div>
        </div>

        {isEditing && (
          <div className="space-y-1.5">
            <span className={fieldLabel}>Data e hora *</span>
            <SheetSelectField
              summary={formatDataHora(formData.betTime)}
              onOpen={() => setDataHoraOpen(true)}
              className="min-h-[44px] sm:min-h-[36px]"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="bet-sport" className={fieldLabel}>Esporte</label>
            <Input
              placeholder="Ex: Futebol"
              id="bet-sport"
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="bet-stake" className={fieldLabel}>Stake (R$) *</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 100,00"
              id="bet-stake"
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

      <DataHoraSheet
        open={dataHoraOpen}
        onOpenChange={setDataHoraOpen}
        value={formData.betTime}
        onApply={(betTime) => setFormData({ ...formData, betTime })}
      />

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
