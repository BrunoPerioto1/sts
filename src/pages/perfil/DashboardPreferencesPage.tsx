import { useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, CaretLeft, CaretRight, DotsSixVertical } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { DashboardKpiCard } from "@/components/dashboard/DashboardKpiCard";
import { ICON_REGISTRY, resolveKpiIcon } from "@/components/dashboard/dashboard-icons";
import { useDashboardPreferences } from "@/hooks/dashboard/use-dashboard-preferences";
import { DASHBOARD_KPI_REGISTRY, ICON_IDS, POSITIVE_COLORS, NEGATIVE_COLORS, defaultDashboardPreferences, performanceColor, moveKpi, toggleKpi, type KpiId, type KpiPreference, type DashboardPreferences } from "@/lib/dashboard-preferences";
import { cn } from "@/lib/utils";

export default function DashboardPreferencesPage() {
  const { me, preferences, save, saving, error, reloadMe } = useDashboardPreferences();
  const [iconKpi, setIconKpi] = useState<KpiId | null>(null);
  const [colorSide, setColorSide] = useState<"positive" | "negative" | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [drag, setDrag] = useState<{ id: KpiId; rows: KpiPreference[]; offset: number } | null>(null);
  const gesture = useRef<{ id: KpiId; rows: KpiPreference[]; startY: number; from: number; height: number } | null>(null);
  const rows = drag?.rows ?? preferences.kpis;
  const colors = preferences.performanceColors;

  function updateColors(patch: Partial<DashboardPreferences["performanceColors"]>) {
    void save({ ...preferences, performanceColors: { ...colors, ...patch } });
  }
  function reorder(from: number, to: number) {
    const next = moveKpi(preferences.kpis, from, to);
    if (next === preferences.kpis) return;
    setAnnouncement(`${DASHBOARD_KPI_REGISTRY[next[to].id].label}: posição ${to + 1} de 8.`);
    void save({ ...preferences, kpis: next });
  }
  function startDrag(event: PointerEvent<HTMLButtonElement>, id: KpiId, from: number) {
    if (saving || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const height = event.currentTarget.closest("li")!.getBoundingClientRect().height;
    gesture.current = { id, rows: preferences.kpis, startY: event.clientY, from, height };
    setDrag({ id, rows: preferences.kpis, offset: 0 });
  }
  function dragMove(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (!current) return;
    const distance = event.clientY - current.startY;
    const to = Math.max(0, Math.min(7, current.from + Math.round(distance / current.height)));
    const next = moveKpi(current.rows, current.from, to);
    setDrag({ id: current.id, rows: next, offset: distance - (to - current.from) * current.height });
  }
  function endDrag(cancel = false) {
    const current = gesture.current;
    gesture.current = null;
    if (!cancel && drag && current && drag.rows.some((row, index) => row.id !== current.rows[index].id)) {
      setAnnouncement(`${DASHBOARD_KPI_REGISTRY[drag.id].label}: posição ${drag.rows.findIndex((row) => row.id === drag.id) + 1} de 8.`);
      void save({ ...preferences, kpis: drag.rows });
    }
    setDrag(null);
  }
  function toggle(id: KpiId) {
    const next = toggleKpi(preferences.kpis, id);
    if (next === preferences.kpis) {
      setAnnouncement("Selecione pelo menos 2 indicadores.");
      return;
    }
    setAnnouncement("");
    void save({ ...preferences, kpis: next });
  }
  const title = "Personalizar Dashboard";
  return <MainLayout title={title} hideHeaderBorder hideBottomNav mobileHeader={
    <div className="flex items-center gap-2 min-w-0">
      <Link to="/profile" aria-label="Voltar" className="h-11 w-11 shrink-0 flex items-center justify-center text-zinc-400"><CaretLeft size={20} /></Link>
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  }>
    <div className="max-w-xl space-y-7 pb-6">
      <p className="text-sm text-zinc-400">Escolha os indicadores, ordem, ícones e aparência do seu Dashboard.</p>
      {!me ? <div role="status" className="space-y-3"><p>Carregando preferências…</p><Button variant="outline" onClick={reloadMe}>Tentar novamente</Button></div> : <>
        <section aria-labelledby="indicators-title">
          <h2 id="indicators-title" className="text-base font-semibold">Indicadores</h2>
          <p className="text-sm text-zinc-400 mt-1">Escolha quais informações aparecem no Dashboard.</p>
          <p id="reorder-help" className="text-xs text-zinc-400 mt-2">Arraste pela alça ou use as setas para ordenar. Selecione de 2 a 8 indicadores.</p>
          <ol className="mt-4 border-y border-border" aria-label="Ordem dos indicadores">
            {rows.map((kpi, index) => {
              const meta = DASHBOARD_KPI_REGISTRY[kpi.id];
              const IconComponent = resolveKpiIcon(kpi.id, kpi.icon);
              const original = gesture.current?.rows.findIndex((row) => row.id === kpi.id) ?? index;
              const shift = drag && gesture.current ? (index - original) * gesture.current.height : 0;
              // Mantém a ordem DOM durante o gesto para preservar pointer capture.
              return { kpi, index, meta, IconComponent, original, shift };
            }).sort((a, b) => drag ? a.original - b.original : a.index - b.index).map(({ kpi, index, meta, IconComponent, shift }) => (
              <li key={kpi.id} className={cn("relative flex h-[76px] items-center border-b last:border-b-0 border-border", drag?.id === kpi.id && "z-10 rounded-xl bg-secondary shadow-md", drag && drag.id !== kpi.id && "transition-transform duration-150 motion-reduce:transition-none")}
                style={{ transform: drag ? `translateY(${shift + (drag.id === kpi.id ? drag.offset : 0)}px)` : undefined }}>
                <button type="button" disabled={saving} aria-label={`Reordenar ${meta.label}`} aria-describedby="reorder-help" className="h-11 w-11 shrink-0 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing text-zinc-400 disabled:opacity-50"
                  onPointerDown={(event) => startDrag(event, kpi.id, index)} onPointerMove={dragMove} onPointerUp={() => endDrag()} onPointerCancel={() => endDrag(true)} onLostPointerCapture={() => { if (gesture.current) endDrag(true); }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") endDrag(true);
                    if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); reorder(index, index + (event.key === "ArrowUp" ? -1 : 1)); }
                  }}><DotsSixVertical size={22} /></button>
                <button type="button" disabled={saving || !!drag} aria-label={`Alterar ícone de ${meta.label}`} onClick={() => setIconKpi(kpi.id)} className="h-11 w-11 shrink-0 rounded-xl bg-white/[0.04] flex items-center justify-center text-zinc-400"><IconComponent size={21} /></button>
                <span className={cn("flex-1 min-w-0 pl-2 text-sm", !kpi.visible && "text-zinc-400")}>{meta.label}</span>
                <div className="flex shrink-0">
                  <button type="button" disabled={saving || !!drag || index === 0} aria-label={`Mover ${meta.label} para cima`} onClick={() => reorder(index, index - 1)} className="w-11 h-11 flex items-center justify-center text-zinc-400 disabled:opacity-25"><ArrowUp size={14} /></button>
                  <button type="button" disabled={saving || !!drag || index === 7} aria-label={`Mover ${meta.label} para baixo`} onClick={() => reorder(index, index + 1)} className="w-11 h-11 flex items-center justify-center text-zinc-400 disabled:opacity-25"><ArrowDown size={14} /></button>
                </div>
                <label className="h-11 w-11 shrink-0 flex items-center justify-center cursor-pointer"><Checkbox aria-label={`Mostrar ${meta.label}`} checked={kpi.visible} disabled={saving || !!drag} onCheckedChange={() => toggle(kpi.id)} /></label>
              </li>
            ))}
          </ol>
          <p role="status" aria-live="polite" className="mt-2 text-xs text-zinc-300 min-h-4">{announcement}</p>
        </section>

        <section aria-labelledby="performance-title" className="space-y-4">
          <div><h2 id="performance-title" className="text-base font-semibold">Cores de desempenho</h2><p className="text-sm text-zinc-400 mt-1">Destaque resultados positivos e negativos.</p></div>
          <label className="flex gap-3 items-start cursor-pointer py-2">
            <Checkbox className="mt-1 shrink-0" checked={colors.enabled} disabled={saving} onCheckedChange={(checked) => updateColors({ enabled: checked === true })} />
            <span><span className="block text-sm">Usar cores para resultados positivos e negativos</span><span className="block text-xs text-zinc-400 mt-1">Valores positivos usam a cor de sucesso e valores negativos usam a cor de perda.</span></span>
          </label>
          {colors.enabled && <>
            <label className="flex gap-3 items-start cursor-pointer py-2">
              <Checkbox className="mt-1 shrink-0" checked={colors.customEnabled} disabled={saving} onCheckedChange={(checked) => updateColors({ customEnabled: checked === true })} />
              <span><span className="block text-sm">Usar cores personalizadas</span><span className="block text-xs text-zinc-400 mt-1">Escolha as cores usadas para resultados positivos e negativos.</span></span>
            </label>
            {colors.customEnabled && <div className="divide-y divide-border border-y border-border">
              {(["positive", "negative"] as const).map((side) => {
                const color = side === "positive" ? POSITIVE_COLORS[colors.positive] : NEGATIVE_COLORS[colors.negative];
                return <button type="button" key={side} disabled={saving} onClick={() => setColorSide(side)} className="flex items-center gap-3 w-full min-h-16 py-3 text-left">
                  <span className="w-5 h-5 rounded-full" style={{ backgroundColor: color.token }} aria-hidden="true" />
                  <span className="flex-1"><span className="block text-sm">{side === "positive" ? "Positivo" : "Negativo"}</span><span className="block text-xs text-zinc-400">{color.label}</span></span><CaretRight size={16} />
                </button>;
              })}
            </div>}
            <Button variant="ghost" disabled={saving} onClick={() => updateColors(defaultDashboardPreferences().performanceColors)}>Restaurar cores padrão</Button>
          </>}
        </section>

        <section aria-labelledby="preview-title">
          <h2 id="preview-title" className="text-base font-semibold">Prévia</h2>
          <p className="text-xs text-zinc-400 mt-1">Valores ilustrativos para comparar positivos e negativos.</p>
          <div className="grid grid-cols-2 auto-rows-fr gap-2.5 mt-3">
            {([{ id: "roi", value: "+106.1%", signed: 106.1 }, { id: "units", value: "+26,6 U", signed: 26.6 }, { id: "roi", value: "-20.5%", signed: -20.5 }, { id: "units", value: "-5,2 U", signed: -5.2 }] as const).map((tile, index) => <DashboardKpiCard key={index} label={DASHBOARD_KPI_REGISTRY[tile.id].label} value={tile.value} icon={resolveKpiIcon(tile.id, preferences.kpis.find((kpi) => kpi.id === tile.id)!.icon)} color={performanceColor(tile.signed, colors)} />)}
          </div>
        </section>
        <p role="status" className="text-xs text-zinc-400">{saving ? "Salvando…" : error ? "Alteração não salva. A configuração anterior foi mantida." : "Alterações salvas automaticamente."}</p>
        {error && <p role="alert" className="text-sm text-negative">{error}</p>}
        <Button variant="outline" className="w-full min-h-11" disabled={saving} onClick={() => setRestoreOpen(true)}>Restaurar Dashboard padrão</Button>
      </>}
    </div>
    <BottomSheet open={iconKpi !== null} onOpenChange={(open) => { if (!open) setIconKpi(null); }} title={iconKpi ? `Ícone de ${DASHBOARD_KPI_REGISTRY[iconKpi].label}` : "Ícone"} contentClassName="sm:max-w-xl sm:mx-auto">
      {iconKpi && <div className="pb-6">
        <div className="grid grid-cols-4 gap-2">
          {ICON_IDS.map((id) => {
            const { icon: IconComponent, label } = ICON_REGISTRY[id];
            const selected = preferences.kpis.find((kpi) => kpi.id === iconKpi)?.icon === id;
            return <button type="button" key={id} aria-label={label} aria-pressed={selected} disabled={saving} className={cn("min-h-16 rounded-xl border flex flex-col items-center justify-center gap-1", selected ? "border-accent bg-accent/10" : "border-border")} onClick={() => {
              void save({ ...preferences, kpis: preferences.kpis.map((kpi) => kpi.id === iconKpi ? { ...kpi, icon: id } : kpi) }); setIconKpi(null);
            }}><IconComponent size={22} /><span className="text-[10px] text-zinc-400">{label}</span></button>;
          })}
        </div>
        <Button variant="outline" disabled={saving} className="w-full mt-4" onClick={() => { void save({ ...preferences, kpis: preferences.kpis.map((kpi) => kpi.id === iconKpi ? { ...kpi, icon: DASHBOARD_KPI_REGISTRY[iconKpi].defaultIcon } : kpi) }); setIconKpi(null); }}>Ícone padrão</Button>
      </div>}
    </BottomSheet>
    <BottomSheet open={colorSide !== null} onOpenChange={(open) => { if (!open) setColorSide(null); }} title={colorSide === "positive" ? "Cor positiva" : "Cor negativa"} contentClassName="sm:max-w-xl sm:mx-auto">
      <div className="space-y-2 pb-6">{Object.entries(colorSide === "positive" ? POSITIVE_COLORS : NEGATIVE_COLORS).map(([id, color]) => <button type="button" key={id} disabled={saving} aria-pressed={colorSide !== null && colors[colorSide] === id} className={cn("flex items-center gap-3 min-h-14 w-full p-3 border rounded-xl text-sm", colorSide && colors[colorSide] === id ? "border-accent bg-accent/10" : "border-border")} onClick={() => {
        if (colorSide === "positive") updateColors({ positive: id as keyof typeof POSITIVE_COLORS });
        if (colorSide === "negative") updateColors({ negative: id as keyof typeof NEGATIVE_COLORS });
        setColorSide(null);
      }}><span className="w-6 h-6 rounded-full" style={{ backgroundColor: color.token }} aria-hidden="true" />{color.label}</button>)}</div>
    </BottomSheet>
    <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Restaurar personalização?</AlertDialogTitle><AlertDialogDescription>Indicadores, ordem, ícones e cores voltarão para o padrão.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={saving} onClick={() => void save(null)}>Restaurar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </MainLayout>;
}
