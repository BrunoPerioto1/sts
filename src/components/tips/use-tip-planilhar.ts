import { useState } from "react";
import { parsePtBrNumber } from "@/lib/format";
import type { PlanilharTipDto, TipItem } from "@/api/routes/get-tips";

export const toInput = (value: number | null) => value?.toFixed(2).replace(".", ",") ?? "";

// Estado e contas do "Conseguiu apostar?", compartilhados pelo sheet (mobile)
// e pelo dialog (desktop) — as duas telas fazem a mesma pergunta, só o
// invólucro muda.
export function useTipPlanilhar(tip: TipItem) {
  const [stake, setStake] = useState(toInput(tip.recommendedStake));
  const [odd, setOdd] = useState(toInput(tip.odd));
  const [houseIds, setHouseIds] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);

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
