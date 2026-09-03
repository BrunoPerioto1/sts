import { format, startOfMonth, startOfYear, subDays } from "date-fns";

export type PeriodPreset = "mes" | "60d" | "ano" | "tudo" | "custom";

export interface ApostasPeriod {
  preset: PeriodPreset;
  from: string; // yyyy-MM-dd, vazio quando preset "tudo"
  to: string;
}

export interface ApostasFilterState {
  period: ApostasPeriod;
  status: string[];
  houseIds: number[];
}

export function defaultPeriod(): ApostasPeriod {
  return { preset: "mes", ...periodRangeFor("mes") };
}

// Calcula from/to pros presets fixos (não usado pra "custom", que já vem com
// datas explícitas escolhidas no calendário).
export function periodRangeFor(preset: Exclude<PeriodPreset, "custom">): { from: string; to: string } {
  const today = format(new Date(), "yyyy-MM-dd");
  switch (preset) {
    case "mes":
      return { from: format(startOfMonth(new Date()), "yyyy-MM-dd"), to: today };
    case "60d":
      return { from: format(subDays(new Date(), 60), "yyyy-MM-dd"), to: today };
    case "ano":
      return { from: format(startOfYear(new Date()), "yyyy-MM-dd"), to: today };
    case "tudo":
      return { from: "", to: "" };
  }
}
