import { endOfMonth, format, startOfMonth, startOfYear, subDays } from "date-fns";

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
  sportIds: number[];
}

export function defaultPeriod(): ApostasPeriod {
  // Dia 1 ate hoje — o chip "Mes atual" e que estende ate o fim do mes.
  return {
    preset: "custom",
    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  };
}

// Calcula from/to pros presets fixos (não usado pra "custom", que já vem com
// datas explícitas escolhidas no calendário).
export function periodRangeFor(preset: Exclude<PeriodPreset, "custom">): { from: string; to: string } {
  const today = format(new Date(), "yyyy-MM-dd");
  switch (preset) {
    case "mes":
      // Vai ate o fim do mes, nao ate hoje: aposta planilhada pra um jogo de
      // amanha tem event_start_at futuro e sumiria do filtro padrao.
      return { from: format(startOfMonth(new Date()), "yyyy-MM-dd"), to: format(endOfMonth(new Date()), "yyyy-MM-dd") };
    case "60d":
      return { from: format(subDays(new Date(), 60), "yyyy-MM-dd"), to: today };
    case "ano":
      return { from: format(startOfYear(new Date()), "yyyy-MM-dd"), to: today };
    case "tudo":
      return { from: "", to: "" };
  }
}
