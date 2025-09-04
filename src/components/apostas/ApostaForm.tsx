import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [formData, setFormData] = useState({
    game: initialData?.game || "",
    market: initialData?.market || "",
    odd: initialData?.odd?.toString() || "",
    stake: initialData?.stake?.toString() || "",
    houseId: (initialData as any)?.houseId ?? initialData?.houseId ?? undefined as number | undefined,
    sport: initialData?.sport || "futebol",
    status: "pendente"
  });
  const selectedHouseName = useMemo(() => {
    const found = houses.find(h => h.id === formData.houseId);
    return found?.name || "";
  }, [houses, formData.houseId]);

  useEffect(() => {
    const loadHouses = async () => {
      try {
        const data = await getAllHouses();
        const normalized = data.map((h: any) => ({ id: Number(h.houseId ?? h.id), name: h.houseName ?? h.name })) as { id: number; name: string }[];
        setHouses(normalized);
        if ((initialData as any)?.houseId) {
          const match = normalized.find(h => h.id === (initialData as any).houseId);
          if (match) setFormData(prev => ({ ...prev, houseId: match.id }));
        }
      } catch (e) {
        // silencioso
      }
    };
    loadHouses();
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.game || !formData.market || !formData.odd || !formData.stake || !formData.houseId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

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
        };
        const created = await createBetRoute(payload);
        onApostaAdded(created);
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      return;
    }
    
    if (!isEditing) {
      setFormData({
        game: "",
        market: "",
        odd: "",
        stake: "",
        houseId: undefined,
        sport: "futebol",
        status: "pendente"
      });
    }

    toast({
      title: "Sucesso",
      description: isEditing ? "Aposta atualizada com sucesso!" : "Aposta registrada com sucesso!",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">{isEditing ? "Editar Aposta" : "Registrar Nova Aposta"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mercado">Mercado *</Label>
              <Input
                id="mercado"
                placeholder="Ex: Vitória do Palmeiras"
                value={formData.market}
                onChange={(e) => setFormData({ ...formData, market: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evento">Jogo *</Label>
              <Input
                id="evento"
                placeholder="Ex: Palmeiras vs Flamengo"
                value={formData.game}
                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odd">Odd *</Label>
              <Input
                id="odd"
                type="number"
                step="0.01"
                placeholder="Ex: 2.50"
                value={formData.odd}
                onChange={(e) => setFormData({ ...formData, odd: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="Ex: 100.00"
                value={formData.stake}
                onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="casa">Casa de Aposta *</Label>
              <Select value={formData.houseId?.toString()} onValueChange={(value) => setFormData({ ...formData, houseId: Number(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a casa" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map(h => (
                    <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="esporte">Esporte *</Label>
              <Input
                id="esporte"
                placeholder="Ex: futebol"
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Status da aposta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="ganha">Ganha</SelectItem>
                  <SelectItem value="perdida">Perdida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {isEditing ? "Atualizar Aposta" : "Registrar Aposta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}