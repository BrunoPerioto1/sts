import { useEffect, useMemo, useState } from "react";
import { actionToast, Check } from "@/lib/action-toast";
import { createBet as createBetRoute, updateBet as updateBetRoute, type BetItem } from "@/api/routes/get-bets";
import { useHouses } from "@/hooks/queries/use-houses";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";

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
  const houses = useHouses();
  const invalidate = useInvalidateBetData();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ApostaFormData>({
    game: initialData?.game || "",
    market: initialData?.market || "",
    odd: initialData?.odd?.toString() || "",
    stake: initialData?.stake?.toString() || "",
    houseId: initialData?.houseId,
    sport: initialData?.sport || "Futebol",
  });

  // Reaplica a casa da aposta em edicao quando ela aparece na lista — o
  // formData e inicializado uma vez so, entao trocar de aposta com o hook ja
  // montado nao atualizaria o select sozinho.
  useEffect(() => {
    const houseId = initialData?.houseId;
    if (!houseId) return;
    if (houses.some((h) => h.id === houseId)) {
      setFormData((prev) => ({ ...prev, houseId }));
    }
  }, [initialData, houses]);

  const potentialReturn = useMemo(() => {
    const odd = parseFloat(formData.odd.replace(",", "."));
    const stake = parseFloat(formData.stake.replace(",", "."));
    if (!Number.isFinite(odd) || !Number.isFinite(stake) || odd <= 0 || stake <= 0) return null;
    return { total: odd * stake, profit: odd * stake - stake };
  }, [formData.odd, formData.stake]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.game || !formData.market || !formData.odd || !formData.stake || !formData.houseId) {
      actionToast.error({ description: "Preencha todos os campos obrigatórios" });
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
      // Aposta nova/editada muda lista, saldo da casa e metricas do dashboard —
      // sem isso as outras telas ficariam com o numero velho ate o cache expirar.
      invalidate();
      actionToast.success({ icon: Check, title: isEditing ? "Aposta atualizada" : "Aposta registrada" });
    } catch (e) {
      const description = e instanceof Error ? e.message : "Falha ao salvar aposta";
      actionToast.error({ description });
    } finally {
      setSubmitting(false);
    }
  };

  return { formData, setFormData, houses, submitting, potentialReturn, handleSubmit };
}
