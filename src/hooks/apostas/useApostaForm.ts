import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createBet as createBetRoute, updateBet as updateBetRoute, type BetItem } from "@/api/routes/get-bets";
import { getAllHouses } from "@/api/routes/get-houses";

export interface ApostaFormData {
  game: string;
  market: string;
  odd: string;
  stake: string;
  houseId: number | undefined;
  sport: string;
}

interface UseApostaFormArgs {
  onApostaAdded: (aposta: BetItem) => void;
  initialData?: BetItem;
  isEditing?: boolean;
}

// Estado e submit compartilhados entre o form desktop (ApostaForm.tsx) e o
// bottom sheet mobile (MobileApostaFormSheet.tsx) — mesma validação e mesmo
// payload pros dois, só a apresentação muda.
export function useApostaForm({ onApostaAdded, initialData, isEditing = false }: UseApostaFormArgs) {
  const { toast } = useToast();
  const [houses, setHouses] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ApostaFormData>({
    game: initialData?.game || "",
    market: initialData?.market || "",
    odd: initialData?.odd?.toString() || "",
    stake: initialData?.stake?.toString() || "",
    houseId: initialData?.houseId,
    sport: initialData?.sport || "Futebol",
  });

  useEffect(() => {
    getAllHouses()
      .then((data) => {
        const normalized = data.map((h) => ({ id: Number(h.id), name: h.name }));
        setHouses(normalized);
        if (initialData?.houseId) {
          const match = normalized.find((h) => h.id === initialData.houseId);
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
        const payload = {
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
    } catch (e) {
      const description = e instanceof Error ? e.message : "Falha ao salvar aposta";
      toast({ title: "Erro", description, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return { formData, setFormData, houses, submitting, potentialReturn, handleSubmit };
}
