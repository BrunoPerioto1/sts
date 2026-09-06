import { useMemo, useState } from "react";
import type { MeResponse } from "@/api/routes/get-me";
import { patchMe } from "@/api/routes/patch-me";
import { parsePtBrNumber } from "@/lib/format";
import { getErrorMessage } from "@/lib/api-error";
import { actionToast } from "@/lib/action-toast";

export const THRESHOLD_MIN = 0.01;
export const THRESHOLD_MAX = 5;
const THRESHOLD_DEFAULT = 1;

export function toPtBr(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export function usePreferencesForm(me: MeResponse | null, onSaved: (me: MeResponse) => void) {
  const [stakeInput, setStakeInput] = useState(me?.stake != null ? toPtBr(Number(me.stake)) : "");
  const [thresholdInput, setThresholdInput] = useState(
    me?.minPercentFilter != null ? toPtBr(Number(me.minPercentFilter)) : toPtBr(THRESHOLD_DEFAULT)
  );
  const [saving, setSaving] = useState(false);

  const resetFrom = (data: MeResponse) => {
    setStakeInput(data.stake != null ? toPtBr(Number(data.stake)) : "");
    setThresholdInput(data.minPercentFilter != null ? toPtBr(Number(data.minPercentFilter)) : toPtBr(THRESHOLD_DEFAULT));
  };

  const stakeNum = stakeInput.trim() === "" ? null : parsePtBrNumber(stakeInput);
  const stakeError = stakeNum !== null && (!Number.isFinite(stakeNum) || stakeNum < 0) ? "Valor mínimo é 0." : null;

  const thresholdNum = parsePtBrNumber(thresholdInput);
  const thresholdValid = Number.isFinite(thresholdNum) && thresholdNum >= THRESHOLD_MIN && thresholdNum <= THRESHOLD_MAX;
  const thresholdError = !thresholdValid ? "Informe um valor entre 0,01% e 5,00%" : null;

  const sliderValue = useMemo(() => {
    if (Number.isFinite(thresholdNum)) return Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, thresholdNum));
    return THRESHOLD_DEFAULT;
  }, [thresholdNum]);

  const canSave = !stakeError && !thresholdError && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: { stake?: number; minPercentFilter?: number } = { minPercentFilter: thresholdNum };
      if (stakeNum !== null) payload.stake = stakeNum;
      const updated = await patchMe(payload);
      resetFrom(updated);
      onSaved(updated);
      actionToast.success({ title: "Preferências salvas" });
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao salvar.") });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (me) resetFrom(me);
  };

  return {
    stakeInput,
    setStakeInput,
    thresholdInput,
    setThresholdInput,
    stakeError,
    thresholdError,
    sliderValue,
    canSave,
    saving,
    handleSave,
    handleDiscard,
    resetFrom,
  };
}
