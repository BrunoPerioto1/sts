export const DASHBOARD_KPI_REGISTRY = {
  roi: { label: "ROI", defaultIcon: "trending-up", semanticType: "performance" },
  units: { label: "Unidades", defaultIcon: "coins", semanticType: "performance" },
  bets: { label: "Apostas", defaultIcon: "database", semanticType: "neutral" },
  pending: { label: "Pendentes", defaultIcon: "clock", semanticType: "neutral" },
  totalStaked: { label: "Total apostado", defaultIcon: "credit-card", semanticType: "neutral" },
  averageStake: { label: "Stake médio", defaultIcon: "chart-bar", semanticType: "neutral" },
  averageOdd: { label: "Odd média", defaultIcon: "trending-up", semanticType: "neutral" },
  hitRate: { label: "Taxa de acerto", defaultIcon: "target", semanticType: "neutral" },
} as const;

export const ICON_IDS = ["trending-up", "coins", "database", "clock", "credit-card", "chart-bar", "target", "chart-line", "percent", "activity", "layers", "list", "ticket", "timer", "hourglass", "wallet", "banknote", "crosshair", "trophy", "check-circle"] as const;
export type IconId = typeof ICON_IDS[number];
export type KpiId = keyof typeof DASHBOARD_KPI_REGISTRY;
export const KPI_IDS = Object.keys(DASHBOARD_KPI_REGISTRY) as KpiId[];

export const POSITIVE_COLORS = {
  "default-positive": { label: "Verde padrão", token: "var(--dashboard-positive)" },
  emerald: { label: "Esmeralda", token: "var(--dashboard-emerald)" },
  turquoise: { label: "Turquesa", token: "var(--dashboard-turquoise)" },
  blue: { label: "Azul", token: "var(--dashboard-blue)" },
} as const;
export const NEGATIVE_COLORS = {
  "default-negative": { label: "Vermelho padrão", token: "var(--dashboard-negative)" },
  coral: { label: "Coral", token: "var(--dashboard-coral)" },
  orange: { label: "Laranja", token: "var(--dashboard-orange)" },
  pink: { label: "Rosa", token: "var(--dashboard-pink)" },
} as const;

export interface KpiPreference { id: KpiId; visible: boolean; icon: IconId }
export interface DashboardPreferences {
  // A ordem do array é a ordem visual; não há um segundo índice a sincronizar.
  kpis: KpiPreference[];
  performanceColors: {
    enabled: boolean;
    customEnabled: boolean;
    positive: keyof typeof POSITIVE_COLORS;
    negative: keyof typeof NEGATIVE_COLORS;
  };
}

export function defaultDashboardPreferences(): DashboardPreferences {
  return {
    kpis: KPI_IDS.map((id) => ({ id, visible: true, icon: DASHBOARD_KPI_REGISTRY[id].defaultIcon })),
    performanceColors: { enabled: true, customEnabled: false, positive: "default-positive", negative: "default-negative" },
  };
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function normalizeDashboardPreferences(value: unknown): DashboardPreferences {
  const defaults = defaultDashboardPreferences();
  const raw = record(value);
  const seen = new Set<KpiId>();
  const kpis: KpiPreference[] = [];
  if (Array.isArray(raw.kpis)) {
    for (const item of raw.kpis) {
      const row = record(item);
      const id = row.id as KpiId;
      if (!KPI_IDS.includes(id) || seen.has(id)) continue;
      seen.add(id);
      kpis.push({ id, visible: typeof row.visible === "boolean" ? row.visible : true,
        icon: ICON_IDS.includes(row.icon as IconId) ? row.icon as IconId : DASHBOARD_KPI_REGISTRY[id].defaultIcon });
    }
  }
  kpis.push(...defaults.kpis.filter(({ id }) => !seen.has(id)));
  if (kpis.filter((kpi) => kpi.visible).length < 2) kpis.slice(0, 2).forEach((kpi) => { kpi.visible = true; });
  const colors = record(raw.performanceColors);
  return { kpis, performanceColors: {
    enabled: typeof colors.enabled === "boolean" ? colors.enabled : true,
    customEnabled: typeof colors.customEnabled === "boolean" ? colors.customEnabled : false,
    positive: Object.prototype.hasOwnProperty.call(POSITIVE_COLORS, String(colors.positive)) ? colors.positive as DashboardPreferences["performanceColors"]["positive"] : "default-positive",
    negative: Object.prototype.hasOwnProperty.call(NEGATIVE_COLORS, String(colors.negative)) ? colors.negative as DashboardPreferences["performanceColors"]["negative"] : "default-negative",
  } };
}

export function performanceColor(value: number | null, colors: DashboardPreferences["performanceColors"]): string {
  if (!colors.enabled || value == null || !Number.isFinite(value) || value === 0) return "var(--color-text)";
  return value > 0
    ? POSITIVE_COLORS[colors.customEnabled ? colors.positive : "default-positive"].token
    : NEGATIVE_COLORS[colors.customEnabled ? colors.negative : "default-negative"].token;
}

export function kpiColumnSpan(index: number, count: number): 1 | 2 {
  return count % 2 === 1 && index === count - 1 ? 2 : 1;
}

export function moveKpi(kpis: KpiPreference[], from: number, to: number): KpiPreference[] {
  if (from < 0 || to < 0 || from >= kpis.length || to >= kpis.length) return kpis;
  const next = [...kpis];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

export function toggleKpi(kpis: KpiPreference[], id: KpiId): KpiPreference[] {
  if (kpis.find((kpi) => kpi.id === id)?.visible && kpis.filter((kpi) => kpi.visible).length <= 2) return kpis;
  return kpis.map((kpi) => kpi.id === id ? { ...kpi, visible: !kpi.visible } : kpi);
}
