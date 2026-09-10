import { useEffect, useMemo, useState } from "react";
import { actionToast, Check } from "@/lib/action-toast";
import { parsePtBrNumber } from "@/lib/format";
import { createBet as createBetRoute, updateBet as updateBetRoute, type BetItem } from "@/api/routes/get-bets";
import { useHouses } from "@/hooks/queries/use-houses";
import { LOW_CONFIDENCE, type ParsedBetSlip } from "@/api/routes/post-parse-image";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";

/**
 * Campo do formulário -> chave correspondente em `confidence` na resposta do
 * backend. Os nomes divergem de propósito (o form fala "game"/"houseId", a API
 * fala "event"/"house"), então o de-para tem que ser explícito: consultar
 * `confidence[field]` direto devolve undefined e marca tudo como duvidoso.
 */
const CONFIDENCE_KEY: Record<AiField, string> = {
  game: "event",
  market: "market",
  houseId: "house",
  sport: "sport",
  odd: "odd",
  stake: "stake",
};

/** Campos que a leitura do print consegue preencher. */
export type AiField = "game" | "market" | "houseId" | "sport" | "odd" | "stake";

export interface AiFieldMark {
  /** Veio da IA (ganha o selo "IA" no rótulo). */
  filled: boolean;
  /** Confiança abaixo do piso — a tela pede conferência em amarelo. */
  check: boolean;
}

export interface ApostaFormData {
  game: string;
  market: string;
  odd: string;
  stake: string;
  houseId: number | undefined;
  sport: string;
  betTime: string;
}

function toLocalDateTime(value?: string | Date) {
  const date = value ? new Date(value) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
  // Marcas por campo: quais vieram da IA e quais pedem conferência. Some assim
  // que o usuário digita por cima — a partir daí o valor é dele, não da IA.
  const [aiMarks, setAiMarks] = useState<Partial<Record<AiField, AiFieldMark>>>({});
  const [originalOdd, setOriginalOdd] = useState<number | null>(null);
  const [tipId, setTipId] = useState<number | undefined>(undefined);
  const [formData, setFormData] = useState<ApostaFormData>({
    game: initialData?.game || "",
    market: initialData?.market || "",
    odd: initialData?.odd?.toString() || "",
    stake: initialData?.stake?.toString() || "",
    houseId: initialData?.houseId,
    sport: initialData?.sport || "Futebol",
    betTime: toLocalDateTime(initialData?.betTime),
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

  // Toda edição manual tira o selo do campo. Sem isso o formulário continuaria
  // dizendo "preenchido pela IA" num valor que o usuário corrigiu na mão.
  const setField = <K extends keyof ApostaFormData>(field: K, value: ApostaFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setAiMarks((prev) => {
      if (!prev[field as AiField]) return prev;
      const next = { ...prev };
      delete next[field as AiField];
      return next;
    });
    if (field === "odd") setOriginalOdd(null);
  };

  /**
   * Escreve no formulário o que a IA leu do print. Só preenche campo que veio
   * — o que ela não identificou continua como estava, para o usuário digitar.
   */
  const applyAiFields = (parsed: ParsedBetSlip) => {
    const marks: Partial<Record<AiField, AiFieldMark>> = {};
    const mark = (field: AiField) => {
      const score = parsed.confidence?.[CONFIDENCE_KEY[field]] ?? 1;
      marks[field] = { filled: true, check: score < LOW_CONFIDENCE };
    };

    setFormData((prev) => {
      const next = { ...prev };
      if (parsed.event) { next.game = parsed.event; mark("game"); }
      if (parsed.market) { next.market = parsed.market; mark("market"); }
      if (parsed.sport) { next.sport = parsed.sport; mark("sport"); }
      if (parsed.odd !== null) { next.odd = String(parsed.odd); mark("odd"); }
      if (parsed.stake !== null) { next.stake = String(parsed.stake); mark("stake"); }
      // A casa só é sobrescrita se o usuário ainda não escolheu uma: a escolha
      // dele é sempre mais confiável que a logo lida do print.
      if (parsed.house && !prev.houseId) {
        next.houseId = parsed.house.id;
        mark("houseId");
      }
      return next;
    });
    setAiMarks(marks);
    setOriginalOdd(parsed.originalOdd);
    // Vincular é decisão do usuário: a melhor candidata já vem marcada, mas
    // nada é enviado sem ele confirmar em "Registrar e vincular".
    setTipId(parsed.matchedTips[0]?.tipId);
  };

  const clearAi = () => {
    setAiMarks({});
    setOriginalOdd(null);
    setTipId(undefined);
  };

  /**
   * Zera o formulário inteiro, não só os selos da IA. É o que "Trocar" e
   * "Remover" fazem: sair de um bilhete e entrar noutro não pode deixar
   * evento/odd/stake do print anterior parados na tela.
   */
  const resetForm = () => {
    setFormData({
      game: "",
      market: "",
      odd: "",
      stake: "",
      houseId: undefined,
      sport: "Futebol",
      betTime: toLocalDateTime(),
    });
    clearAi();
  };

  const potentialReturn = useMemo(() => {
    const odd = parsePtBrNumber(formData.odd);
    const stake = parsePtBrNumber(formData.stake);
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
          odd: parsePtBrNumber(formData.odd),
          stake: parsePtBrNumber(formData.stake),
          sport: formData.sport,
          houseId: formData.houseId,
          betTime: new Date(formData.betTime).toISOString(),
        };
        const updated = await updateBetRoute(initialData.id, payload);
        onApostaAdded(updated);
      } else {
        const payload = {
          game: formData.game,
          stake: parsePtBrNumber(formData.stake),
          odd: parsePtBrNumber(formData.odd),
          houseId: formData.houseId,
          market: formData.market,
          sport: formData.sport,
          betTime: new Date(formData.betTime).toISOString(),
          ...(tipId ? { tipId } : {}),
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

  return {
    formData,
    setFormData,
    setField,
    houses,
    submitting,
    potentialReturn,
    handleSubmit,
    aiMarks,
    originalOdd,
    tipId,
    setTipId,
    applyAiFields,
    resetForm,
  };
}
