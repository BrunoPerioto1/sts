import { useState } from "react";
import { parsePtBrNumber } from "@/lib/format";
import type { PlanilharTipDto, TipItem } from "@/api/routes/get-tips";

export const toInput = (value: number | null) => value?.toFixed(2).replace(".", ",") ?? "";

// Estado e contas do "Conseguiu apostar?", compartilhados pelo sheet (mobile)
// e pelo dialog (desktop) — as duas telas fazem a mesma pergunta, só o
// invólucro muda.
// `initial` vem do "Odd mudou?": a stake e a odd de agora substituem as da tip,
// e o bloco da odd já abre — a odd diferente é o motivo de estar ali.
export function useTipPlanilhar(tip: TipItem, initial?: { stake: number | null; odd: number }) {
  const [stake, setStake] = useState(toInput(initial?.stake ?? tip.recommendedStake));
  const [odd, setOdd] = useState(toInput(initial?.odd ?? tip.odd));
  const [houseIds, setHouseIds] = useState<number[]>([]);
  const [editing, setEditing] = useState(initial !== undefined);

  const stakeValue = parsePtBrNumber(stake);
  const oddValue = parsePtBrNumber(odd);
  const valid = stakeValue > 0 && oddValue > 1;

  const overrides = (): PlanilharTipDto => ({
    stake: stakeValue,
    odd: oddValue,
    ...(houseIds[0] ? { houseId: houseIds[0] } : {}),
  });

  return {
    stake,
    setStake,
    odd,
    setOdd,
    houseIds,
    setHouseIds,
    editing,
    setEditing,
    stakeValue,
    oddValue,
    valid,
    retorno: stakeValue * oddValue,
    overrides,
  };
}

export type TipPlanilharForm = ReturnType<typeof useTipPlanilhar>;
