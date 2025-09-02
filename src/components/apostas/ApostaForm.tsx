import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface ApostaFormProps {
  onApostaAdded: (aposta: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

export function ApostaForm({ onApostaAdded, initialData, isEditing = false }: ApostaFormProps) {
  const { toast } = useToast();
  const [houses, setHouses] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState({
    evento: initialData?.evento || "",
    mercado: initialData?.mercado || "",
    odd: initialData?.odd?.toString() || "",
    valor: initialData?.valor?.toString() || "",
    casa: initialData?.casa || "",
    casaId: undefined as number | undefined,
    esporte: initialData?.esporte || "futebol",
    status: initialData?.status || "pendente"
  });
  const selectedHouseName = useMemo(() => {
    const found = houses.find(h => h.id === formData.casaId);
    return found?.name || formData.casa || "";
  }, [houses, formData.casaId, formData.casa]);

  useEffect(() => {
    const loadHouses = async () => {
      try {
        const data = await apiFetch<any[]>("/house");
        const normalized = data.map((h: any) => ({ id: Number(h.id), name: h.name })) as { id: number; name: string }[];
        setHouses(normalized);
        // se veio initialData.casa, tenta selecionar correspondente
        if (initialData?.casa) {
          const match = normalized.find(h => h.name === initialData.casa);
          if (match) setFormData(prev => ({ ...prev, casaId: match.id }));
        }
      } catch (e) {
        // silencioso
      }
    };
    loadHouses();
  }, [initialData?.casa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.evento || !formData.mercado || !formData.odd || !formData.valor || (!formData.casa && !formData.casaId)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isEditing && initialData?.id) {
        // PUT /bets/:id
        const payload: any = {
          game: formData.evento,
          market: formData.mercado,
          odd: parseFloat(formData.odd),
          stake: parseFloat(formData.valor),
          sport: formData.esporte,
        };
        if (formData.casaId) payload.house_id = formData.casaId;
        await apiFetch(`/bets/${initialData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        const updated = {
          id: initialData.id,
          evento: formData.evento,
          mercado: formData.mercado,
          odd: parseFloat(formData.odd),
          valor: parseFloat(formData.valor),
          status: initialData.status ?? "pendente",
          data: initialData.data ?? new Date().toLocaleDateString('pt-BR'),
          hora: initialData.hora ?? new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          casa: selectedHouseName,
        };
        onApostaAdded(updated);
      } else {
        // POST /bets
        const payload = {
          game: formData.evento,
          stake: parseFloat(formData.valor),
          odd: parseFloat(formData.odd),
          house_id: formData.casaId,
          market: formData.mercado,
          sport: formData.esporte,
        };
        const result = await apiFetch<{ id: number }>(`/bets`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const apostaData = {
          id: result.id,
          evento: formData.evento,
          mercado: formData.mercado,
          odd: parseFloat(formData.odd),
          valor: parseFloat(formData.valor),
          status: "pendente",
          data: new Date().toLocaleDateString('pt-BR'),
          hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          casa: selectedHouseName,
        };
        onApostaAdded(apostaData);
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      return;
    }
    
    // Reset form only if not editing
    if (!isEditing) {
      setFormData({
        evento: "",
        mercado: "",
        odd: "",
        valor: "",
        casa: "",
        casaId: undefined,
        esporte: "futebol",
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
                value={formData.mercado}
                onChange={(e) => setFormData({ ...formData, mercado: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evento">Jogo *</Label>
              <Input
                id="evento"
                placeholder="Ex: Palmeiras vs Flamengo"
                value={formData.evento}
                onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
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
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              />
            </div>

            <div className="space-y-2">
                              <Label htmlFor="casa">Casa de Aposta *</Label>
              <Select value={formData.casaId?.toString()} onValueChange={(value) => setFormData({ ...formData, casaId: Number(value) })}>
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
                value={formData.esporte}
                onChange={(e) => setFormData({ ...formData, esporte: e.target.value })}
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