import { endOfMonth, format, parseISO, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";

export type SheetPreset = Extract<DatePreset, "7d" | "14d" | "currentMonth" | "lastMonth" | "60d" | "allTime">;

export const PRESET_LABEL: Record<DatePreset, string> = {
  "7d": "7 dias",
  "14d": "14 dias",
  currentMonth: "Mês atual",
  lastMonth: "Mês passado",
  "60d": "60 dias",
  "90d": "90 dias",
  allTime: "Tudo",
  custom: "Personalizado",
};

const shortDate = (date: Date) => format(date, "d MMM", { locale: ptBR });
const iso = (date: Date) => format(date, "yyyy-MM-dd");

// Intervalo (yyyy-MM-dd, inclusivo nas duas pontas) de cada preset fixo.
export function presetRange(
  preset: Exclude<DatePreset, "custom">,
  firstBetDate: string | null,
  today: Date = new Date()
): { from: string; to: string } {
  switch (preset) {
    case "7d":
    case "14d":
      // 7 dias = hoje + os 6 anteriores.
      return { from: iso(subDays(today, preset === "7d" ? 6 : 13)), to: iso(today) };
    case "currentMonth":
      // Fim do mes, nao hoje: aposta de jogo futuro cai no filtro do mes atual.
      return { from: iso(startOfMonth(today)), to: iso(endOfMonth(today)) };
    case "lastMonth": {
      const lastMonth = subMonths(today, 1);
      return { from: iso(startOfMonth(lastMonth)), to: iso(endOfMonth(lastMonth)) };
    }
    case "60d":
    case "90d":
      return { from: iso(subDays(today, preset === "60d" ? 60 : 90)), to: iso(today) };
    case "allTime":
      return { from: firstBetDate ?? "2000-01-01", to: iso(today) };
  }
}

// Mesma conta do applyPreset em useDashboardFilters — aqui só pra mostrar o
// intervalo embaixo de cada opção antes do usuário escolher.
export function presetRangeLabel(preset: SheetPreset, firstBetDate: string | null): string {
  const today = new Date();
  switch (preset) {
    case "7d":
      return `${shortDate(subDays(today, 6))} – ${shortDate(today)}`;
    case "14d":
      return `${shortDate(subDays(today, 13))} – ${shortDate(today)}`;
    case "currentMonth":
      return `${shortDate(startOfMonth(today))} – ${shortDate(endOfMonth(today))}`;
    case "lastMonth": {
      const lastMonth = subMonths(today, 1);
      return `${shortDate(startOfMonth(lastMonth))} – ${shortDate(endOfMonth(lastMonth))}`;
    }
    case "60d":
      return `${shortDate(subDays(today, 60))} – ${shortDate(today)}`;
    case "allTime":
      return firstBetDate ? `desde ${shortDate(parseISO(firstBetDate))}` : "todo o histórico";
  }
}

export const PERIOD_OPTIONS: { value: SheetPreset; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "14d", label: "Últimos 14 dias" },
  { value: "currentMonth", label: "Mês atual" },
  { value: "lastMonth", label: "Mês passado" },
  { value: "60d", label: "Últimos 60 dias" },
  { value: "allTime", label: "Tudo" },
];
