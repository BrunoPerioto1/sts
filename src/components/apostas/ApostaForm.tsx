import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createBet as createBetRoute, updateBet as updateBetRoute, type BetItem } from "@/api/routes/get-bets";
import { getAllHouses } from "@/api/routes/get-houses";

interface ApostaFormProps {
  onApostaAdded: (aposta: BetItem) => void;
  initialData?: BetItem;
  isEditing?: boolean;
}

export function ApostaForm({ onApostaAdded, initialData, isEditing = false }: ApostaFormProps) {
  const { toast } = useToast();
  const [houses, setHouses] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    game: initialData?.game || "",
    market: initialData?.market || "",
    odd: initialData?.odd?.toString() || "",
    stake: initialData?.stake?.toString() || "",
    houseId: (initialData as any)?.houseId ?? undefined as number | undefined,
    sport: initialData?.sport || "Futebol",
  });

  useEffect(() => {
    getAllHouses()
      .then((data) => {
        const normalized = data.map((h: any) => ({ id: Number(h.id), name: h.name }));
        setHouses(normalized);
        if ((initialData as any)?.houseId) {
          const match = normalized.find((h) => h.id === (initialData as any).houseId);
          if (match) setFormData((prev) => ({ ...prev, houseId: match.id }));
        }
      })
      .catch(() => undefined);
  }, [initialData]);

  const potentialReturn = useMemo(() => {
    const odd = parseFloat(formData.odd.replace(",", "."));
    const stake = parseFloat(formData.stake.replace(",", "."));
    if (!Number.isFinite(odd) || !Number.isFinite(stake) || odd <= 0 || stake <= 0) return null;
    return { total: odd * stake, profit: odd * stake - stake };
  }, [formData.odd, formData.stake]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.game || !formData.market || !formData.odd || !formData.stake || !formData.houseId) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && initialData?.id) {
        const payload: any = {
          game: formData.game,
          market: formData.market,
          odd: parseFloat(formData.odd),
          stake: parseFloat(formData.stake),
          sport: formData.sport,
          houseId: formData.houseId,
        };
        const updated = await updateBetRoute(initialData.id, payload);
        onApostaAdded(updated);
      } else {
        const payload = {
          game: formData.game,
          stake: parseFloat(formData.stake),
          odd: parseFloat(formData.odd),
          houseId: formData.houseId,
          market: formData.market,
          sport: formData.sport,
          betTime: new Date().toISOString(),
        };
        const created = await createBetRoute(payload);
        onApostaAdded(created);
      }
      toast({ title: "Sucesso", description: isEditing ? "Aposta atualizada com sucesso!" : "Aposta registrada com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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
          className="flex items-center justify-between rounded-md p-3 text-[13px]"
          style={{ background: "var(--color-bg)", boxShadow: "inset 2px 0 0 var(--color-accent)" }}
        >
          <span>
            Retorno potencial{" "}
            <strong className="text-[20px] text-positive tabular-nums">R$ {potentialReturn.total.toFixed(2)}</strong>
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
