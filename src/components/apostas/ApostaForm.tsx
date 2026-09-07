import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type BetItem } from "@/api/routes/get-bets";
import { useApostaForm } from "@/hooks/apostas/use-aposta-form";

interface ApostaFormProps {
  onApostaAdded: (aposta: BetItem) => void;
  initialData?: BetItem;
  isEditing?: boolean;
}

export function ApostaForm({ onApostaAdded, initialData, isEditing = false }: ApostaFormProps) {
  const { formData, setFormData, houses, submitting, potentialReturn, handleSubmit } = useApostaForm({
    onApostaAdded,
    initialData,
    isEditing,
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="evento" className="text-xs">Evento *</Label>
          <Input id="evento" placeholder="Ex: Palmeiras vs Flamengo" value={formData.game} onChange={(e) => setFormData({ ...formData, game: e.target.value })} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="mercado" className="text-xs">Mercado / Aposta *</Label>
          <Input id="mercado" placeholder="Ex: Resultado Final - Vitória do Palmeiras" value={formData.market} onChange={(e) => setFormData({ ...formData, market: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Casa *</Label>
          <Select value={formData.houseId?.toString()} onValueChange={(value) => setFormData({ ...formData, houseId: Number(value) })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {houses.map((h) => (
                <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isEditing && (
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="bet-time" className="text-xs">Data e hora *</Label>
            <Input id="bet-time" type="datetime-local" value={formData.betTime} onChange={(e) => setFormData({ ...formData, betTime: e.target.value })} />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="esporte" className="text-xs">Esporte</Label>
          <Input id="esporte" placeholder="Ex: futebol" value={formData.sport} onChange={(e) => setFormData({ ...formData, sport: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="odd" className="text-xs">Odd *</Label>
          <Input id="odd" type="number" step="0.01" placeholder="Ex: 2.50" value={formData.odd} onChange={(e) => setFormData({ ...formData, odd: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stake" className="text-xs">Stake (R$) *</Label>
          <Input id="stake" type="number" step="0.01" placeholder="Ex: 100.00" value={formData.stake} onChange={(e) => setFormData({ ...formData, stake: e.target.value })} />
        </div>
      </div>

      {potentialReturn && (
        <div
          className="flex items-center justify-between rounded-md p-3 text-sm"
          style={{ background: "var(--color-bg)", boxShadow: "inset 2px 0 0 var(--color-accent)" }}
        >
          <span>
            Retorno potencial{" "}
            <strong className="text-xl text-positive tabular-nums">R$ {potentialReturn.total.toFixed(2)}</strong>
          </span>
          <span className="opacity-70">Lucro se ganhar +R$ {potentialReturn.profit.toFixed(2)}</span>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-1">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando…" : isEditing ? "Atualizar aposta" : "Registrar aposta"}
        </Button>
      </div>
    </form>
  );
}
