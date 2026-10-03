import { useRef, useState, type DragEvent } from "react";
import { ArrowDown, ArrowUp, DotsSixVertical, Plus, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented } from "@/components/ui/segmented";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ICON_REGISTRY, resolveKpiIcon } from "@/components/dashboard/dashboard-icons";
import { useDashboardPreferences } from "@/hooks/dashboard/use-dashboard-preferences";
import { DASHBOARD_KPI_REGISTRY, ICON_IDS, KPI_IDS, NEGATIVE_COLORS, POSITIVE_COLORS, moveKpi, type DashboardPreferences, type KpiId, type KpiPreference } from "@/lib/dashboard-preferences";
import { cn } from "@/lib/utils";
import { DashboardPreview } from "./DashboardPreview";

const MIN_KPIS = 2;
const MAX_KPIS = KPI_IDS.length;

type ColorMode = "neutral" | "default" | "custom";
const COLOR_MODES = [
  { value: "neutral", label: "Neutro" },
  { value: "default", label: "Verde / vermelho" },
  { value: "custom", label: "Personalizado" },
] as const;

/**
 * Aba Dashboard das configurações no desktop. Só os indicadores visíveis
 * aparecem na lista (na ordem do Dashboard); os ocultos viram chips para
 * adicionar. Cada mudança salva sozinha, como no mobile.
 */
export function DashboardSettingsDesktop() {
  const { me, preferences, save, saving, error, reloadMe } = useDashboardPreferences();
  const [dragRows, setDragRows] = useState<KpiPreference[] | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const dragId = useRef<KpiId | null>(null);
  // Só a alça inicia o arraste: a linha é `draggable`, mas o dragstart é
  // cancelado se o ponteiro não desceu na alça.
  const handleArmed = useRef(false);

  const visible = preferences.kpis.filter((kpi) => kpi.visible);
  const hidden = preferences.kpis.filter((kpi) => !kpi.visible);
  const rows = dragRows ?? visible;
  const colors = preferences.performanceColors;
  const colorMode: ColorMode = !colors.enabled ? "neutral" : colors.customEnabled ? "custom" : "default";

  // Visíveis primeiro, na ordem da lista; ocultos no fim.
  function commit(nextVisible: KpiPreference[], nextHidden: KpiPreference[] = hidden) {
    void save({ ...preferences, kpis: [...nextVisible, ...nextHidden.map((kpi) => ({ ...kpi, visible: false }))] });
  }
  function move(from: number, to: number) {
    const next = moveKpi(visible, from, to);
    if (next === visible) return;
    setAnnouncement(`${DASHBOARD_KPI_REGISTRY[next[to].id].label}: posição ${to + 1} de ${visible.length}.`);
    commit(next);
  }
  function remove(kpi: KpiPreference) {
    if (visible.length <= MIN_KPIS) return;
    commit(visible.filter((row) => row.id !== kpi.id), [...hidden, kpi]);
  }
  function add(kpi: KpiPreference) {
    commit([...visible, { ...kpi, visible: true }], hidden.filter((row) => row.id !== kpi.id));
  }
  function setIcon(id: KpiId, icon: KpiPreference["icon"]) {
    void save({ ...preferences, kpis: preferences.kpis.map((kpi) => (kpi.id === id ? { ...kpi, icon } : kpi)) });
  }
  function updateColors(patch: Partial<DashboardPreferences["performanceColors"]>) {
    void save({ ...preferences, performanceColors: { ...colors, ...patch } });
  }
  function setColorMode(mode: ColorMode) {
    updateColors(mode === "neutral" ? { enabled: false } : { enabled: true, customEnabled: mode === "custom" });
  }

  function onDragStart(event: DragEvent<HTMLLIElement>, id: KpiId) {
    if (!handleArmed.current || saving) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    dragId.current = id;
    setDragRows(visible);
  }
  function onDragOver(event: DragEvent<HTMLLIElement>, overId: KpiId) {
    if (!dragId.current || !dragRows) return;
    event.preventDefault();
    const from = dragRows.findIndex((row) => row.id === dragId.current);
    const to = dragRows.findIndex((row) => row.id === overId);
    if (from !== to) setDragRows(moveKpi(dragRows, from, to));
  }
  function onDragEnd() {
    if (dragRows && dragRows.some((row, i) => row.id !== visible[i].id)) commit(dragRows);
    dragId.current = null;
    handleArmed.current = false;
    setDragRows(null);
  }

  if (!me) {
    return (
      <div role="status" aria-label="Carregando preferências" className="max-w-sm space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" delay={i * 90} />)}
        <Button variant="ghost" size="sm" className="text-zinc-400" onClick={reloadMe}>Recarregar</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-10 items-start pb-6">
      <div className="min-w-0">
        <section aria-labelledby="indicators-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="indicators-title" className="text-base font-semibold">Indicadores</h2>
              <p id="reorder-help" className="text-[13px] text-zinc-400 mt-1">
                Arraste pela alça ou use as setas. Mínimo {MIN_KPIS}, máximo {MAX_KPIS}.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-zinc-400"><span className="text-foreground font-medium">{visible.length}</span> selecionados</p>
              <div className="flex gap-1 mt-1.5" aria-hidden="true">
                {Array.from({ length: MAX_KPIS }, (_, i) => (
                  <span key={i} className={cn("h-1 w-3 rounded-full", i < visible.length ? "bg-accent" : "bg-foreground/10")} />
                ))}
              </div>
            </div>
          </div>

          <ol className="mt-3 rounded-xl border border-border divide-y divide-border" aria-label="Ordem dos indicadores">
            {rows.map((kpi, index) => {
              const meta = DASHBOARD_KPI_REGISTRY[kpi.id];
              const IconComponent = resolveKpiIcon(kpi.id, kpi.icon);
              const busy = saving || !!dragRows;
              return (
                <li
                  key={kpi.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, kpi.id)}
                  onDragOver={(e) => onDragOver(e, kpi.id)}
                  onDrop={(e) => e.preventDefault()}
                  onDragEnd={onDragEnd}
                  className={cn("flex items-center gap-1 h-12 pl-1 pr-2 bg-card first:rounded-t-xl last:rounded-b-xl", dragId.current === kpi.id && "opacity-50")}
                >
                  <span
                    aria-hidden="true"
                    className="h-9 w-7 flex items-center justify-center text-zinc-500 cursor-grab active:cursor-grabbing"
                    onPointerDown={() => { handleArmed.current = true; }}
                    onPointerUp={() => { handleArmed.current = false; }}
                  >
                    <DotsSixVertical size={16} />
                  </span>
                  <span className="w-4 text-xs text-zinc-500 tabular-nums">{index + 1}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Alterar ícone de ${meta.label}`}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-300 hover:bg-foreground/[0.06]"
                      >
                        <IconComponent size={17} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-2">
                      <div className="grid grid-cols-5 gap-1">
                        {ICON_IDS.map((id) => {
                          const { icon: Option, label } = ICON_REGISTRY[id];
                          const selected = kpi.icon === id;
                          return (
                            <button
                              type="button"
                              key={id}
                              title={label}
                              aria-label={label}
                              aria-pressed={selected}
                              onClick={() => setIcon(kpi.id, id)}
                              className={cn("h-9 w-9 rounded-md flex items-center justify-center", selected ? "bg-accent/15 text-foreground ring-1 ring-inset ring-accent/40" : "text-zinc-400 hover:bg-foreground/[0.06]")}
                            >
                              <Option size={18} />
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <span className="flex-1 min-w-0 pl-1 text-sm truncate">{meta.label}</span>
                  <button type="button" disabled={busy || index === 0} aria-label={`Mover ${meta.label} para cima`} aria-describedby="reorder-help" onClick={() => move(index, index - 1)} className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-foreground disabled:opacity-25">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" disabled={busy || index === rows.length - 1} aria-label={`Mover ${meta.label} para baixo`} aria-describedby="reorder-help" onClick={() => move(index, index + 1)} className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-foreground disabled:opacity-25">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" disabled={busy || visible.length <= MIN_KPIS} aria-label={`Remover ${meta.label}`} title={visible.length <= MIN_KPIS ? `Mínimo de ${MIN_KPIS} indicadores` : undefined} onClick={() => remove(kpi)} className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-foreground disabled:opacity-25">
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ol>
          <p role="status" aria-live="polite" className="sr-only">{announcement}</p>

          {hidden.length > 0 && (
            <div className="mt-5">
              <p className="text-[13px] text-zinc-400 mb-2">Adicionar ao dashboard</p>
              <div className="flex flex-wrap gap-2">
                {hidden.map((kpi) => (
                  <Button key={kpi.id} variant="outline" size="sm" className="gap-1.5" disabled={saving} onClick={() => add(kpi)}>
                    <Plus size={13} /> {DASHBOARD_KPI_REGISTRY[kpi.id].label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="colors-title" className="mt-8 pt-8 border-t border-border">
          <h2 id="colors-title" className="text-base font-semibold">Cor dos resultados</h2>
          <p className="text-[13px] text-zinc-400 mt-1 mb-3">Padrão: positivo em verde, negativo em vermelho.</p>
          <Segmented label="Cor dos resultados" value={colorMode} options={COLOR_MODES} onChange={setColorMode} disabled={saving} />
          {colorMode === "custom" && (
            <div className="mt-4 space-y-3">
              {(["positive", "negative"] as const).map((side) => {
                const palette = side === "positive" ? POSITIVE_COLORS : NEGATIVE_COLORS;
                return (
                  <div key={side} className="flex items-center gap-4">
                    <span className="w-16 text-[13px] text-zinc-400">{side === "positive" ? "Positivo" : "Negativo"}</span>
                    <div className="flex gap-2" role="radiogroup" aria-label={side === "positive" ? "Cor positiva" : "Cor negativa"}>
                      {Object.entries(palette).map(([id, color]) => {
                        const selected = colors[side] === id;
                        return (
                          <button
                            type="button"
                            key={id}
                            role="radio"
                            aria-checked={selected}
                            aria-label={color.label}
                            title={color.label}
                            disabled={saving}
                            onClick={() => updateColors({ [side]: id } as Partial<DashboardPreferences["performanceColors"]>)}
                            className={cn("h-7 w-7 rounded-full ring-offset-2 ring-offset-background", selected ? "ring-2 ring-foreground/70" : "hover:ring-1 hover:ring-foreground/30")}
                            style={{ backgroundColor: color.token }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-8 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-zinc-400" disabled={saving} onClick={() => setRestoreOpen(true)}>Restaurar padrão</Button>
          <p role="status" className={cn("text-xs", error ? "text-negative" : "text-zinc-500")}>
            {saving ? "Salvando…" : error ? "Alteração não salva. A configuração anterior foi mantida." : ""}
          </p>
        </div>
      </div>

      <div className="min-w-0 xl:sticky xl:top-28">
        <p className="text-xs text-zinc-500 mb-2">
          <span className="uppercase tracking-wider font-medium mr-2">Prévia</span> topo do Dashboard
        </p>
        <DashboardPreview preferences={preferences} stake={Number(me.stake ?? 0)} />
      </div>

      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar personalização?</AlertDialogTitle>
            <AlertDialogDescription>Indicadores, ordem, ícones e cores voltarão para o padrão.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={() => void save(null)}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
