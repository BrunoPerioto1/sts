import { useEffect, useRef, useState } from "react";
import { ArrowsClockwise, Buildings, CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TipCard } from "@/components/tips/TipCard";
import { TipPlanilharSheet } from "@/components/tips/TipPlanilharSheet";
import { TipPlanilharDialog } from "@/components/tips/TipPlanilharDialog";
import { MobileSearchBar } from "@/components/apostas/MobileSearchHeader";
import { CasaSheet } from "@/components/apostas/CasaSheet";
import { HouseMultiSelect } from "@/components/house/HouseMultiSelect";
import { TipsListDesktop } from "@/components/tips/TipsListDesktop";
import { TipDetailPanel } from "@/components/tips/TipDetailPanel";
import { TipsBulkActionBar } from "@/components/tips/TipsBulkActionBar";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { actionToast } from "@/lib/action-toast";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTipActions, useTips } from "@/hooks/queries/use-tips";
import { useHouses } from "@/hooks/queries/use-houses";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import type { PlanilharTipDto, TipItem, TipStatus } from "@/api/routes/get-tips";

const tabs: { value: TipStatus; label: string; countKey: "pending" | "planilhadas" | "caidas" }[] = [
  { value: "pending", label: "Pendentes", countKey: "pending" },
  { value: "planilhada", label: "Planilhadas", countKey: "planilhadas" },
  { value: "caiu", label: "Caíram", countKey: "caidas" },
];

const emptyByTab: Record<TipStatus, { title: string; description: string }> = {
  pending: {
    title: "Fila limpa",
    // A fila é das últimas 48h de propósito: tip que ninguém encostou em dois
    // dias é jogo que já aconteceu. Sem isso, mexer na % do filtro trazia o
    // histórico inteiro de volta pra fila.
    description:
      "Nada esperando você nas últimas 48h. Avisamos aqui quando o canal mandar a próxima tip.",
  },
  planilhada: {
    title: "Nenhuma planilhada",
    description: "As tips que virarem aposta aparecem aqui, com resultado e lucro em Apostas.",
  },
  caiu: {
    title: "Nenhuma marcada como caiu",
    description: "Tips que você descartar ficam guardadas aqui, e dá para devolver para a fila.",
  },
};

export default function TipsPage() {
  const [tab, setTab] = useState<TipStatus>("pending");
  const isMobile = useIsMobile();
  const [planilhando, setPlanilhando] = useState<TipItem | null>(null);

  // Filtro de casas: mesma multi-seleção de Apostas. A casa da tip vem como
  // texto do canal, então quem casa nome com casa cadastrada é o backend —
  // aqui só viajam os ids.
  const houses = useHouses();
  const [houseIds, setHouseIds] = useState<number[]>([]);
  const [casaSheetOpen, setCasaSheetOpen] = useState(false);

  // Mesmo debounce da busca de Apostas (250 ms): sem ele cada tecla vira uma
  // pagina nova no infinite query.
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const buscaRef = useRef<HTMLInputElement>(null!);
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 250);
    return () => clearTimeout(t);
  }, [busca]);

  const {
    tips,
    summary,
    total,
    isPending,
    isFetching,
    refetch,
  } = useTips(tab, buscaDebounced || undefined, houseIds);

  // Só no desktop: a linha clicada abre o painel da direita. Guarda o id, não
  // a tip — depois de planilhar/descartar a lista é refeita, e um objeto
  // guardado ficaria com o status velho.
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const selecionada = tips.find((t) => t.id === selecionadaId) ?? tips[0] ?? null;
  const { dismiss, undismiss, planilhar, batch } = useTipActions();
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const selectionAnchor = useRef<number | null>(null);
  const [batchReview, setBatchReview] = useState<TipItem[] | null>(null);
  // Nada de `busy` global travando a tela: as ações são otimistas (a tip sai da
  // lista no clique, ver use-tips), então a gravação corre por baixo e a fila
  // continua clicável. Travar tudo até a resposta era o que fazia cada
  // "Planilhar"/"Caiu" parecer lento.
  const canSelect = tab !== "planilhada";
  const checkedTips = tips.filter((tip) => checkedIds.has(tip.id));
  const allChecked = tips.length > 0 && checkedTips.length === tips.length;

  // Seleção pertence à lista atual: filtros, abas e refetch não deixam ids ocultos.
  useEffect(() => {
    selectionAnchor.current = null;
    setCheckedIds(new Set());
    setBatchReview(null);
  }, [tab, buscaDebounced, houseIds]);
  useEffect(() => {
    if (!tips.some((tip) => tip.id === selectionAnchor.current)) selectionAnchor.current = null;
    setCheckedIds((current) => {
      const next = new Set(tips.filter((tip) => current.has(tip.id)).map((tip) => tip.id));
      return next.size === current.size ? current : next;
    });
  }, [tips]);

  const clearSelection = () => {
    selectionAnchor.current = null;
    setCheckedIds(new Set());
  };

  const toggleChecked = (id: number, shiftKey = false) => {
    const anchorIndex = tips.findIndex((tip) => tip.id === selectionAnchor.current);
    const targetIndex = tips.findIndex((tip) => tip.id === id);
    if (targetIndex < 0) return;
    const range = shiftKey && anchorIndex >= 0
      ? tips.slice(Math.min(anchorIndex, targetIndex), Math.max(anchorIndex, targetIndex) + 1)
      : [tips[targetIndex]];
    if (!shiftKey || anchorIndex < 0) selectionAnchor.current = id;
    setCheckedIds((current) => {
      const next = new Set(current);
      const remove = current.has(id);
      for (const tip of range) {
        if (remove) next.delete(tip.id);
        else next.add(tip.id);
      }
      return next;
    });
  };

  // Fecha o diálogo, limpa a seleção e sai: o lote roda em background e o toast
  // chega quando terminar. Quem clicou já pode continuar varrendo a fila.
  const runBatch = (action: "planilhar" | "dismiss" | "undismiss", items = checkedTips) => {
    if (!items.length) return;
    setBatchReview(null);
    clearSelection();
    batch.mutate(
      { tips: items, action },
      {
        onSuccess: (result) => {
          if (result.succeeded.length) {
            const label = action === "planilhar" ? "planilhadas" : action === "dismiss" ? "marcadas como caiu" : "devolvidas para a fila";
            actionToast.success({ title: `${result.succeeded.length} tips ${label}` });
          }
          // As que falharem voltam pra lista sozinhas na revalidação.
          if (result.failed.length) {
            actionToast.error({
              title: `${result.failed.length} tips não concluídas`,
              description: `Continuam na fila. ${result.failed[0].message}`,
            });
          }
        },
        onError: (error: Error) =>
          actionToast.error({ description: error.message || "Não foi possível concluir o lote." }),
      },
    );
  };

  // O sheet fecha antes da resposta, não no onSuccess: a tip já saiu da lista
  // e deixar o modal aberto em "Planilhando…" era a espera mais visível da tela.
  const run = (mutation: typeof dismiss, id: number, title: string) => {
    setPlanilhando(null);
    mutation.mutate(id, {
      onSuccess: () => actionToast.success({ title }),
      onError: (e: Error) => actionToast.error({ description: e.message }),
    });
  };

  const doPlanilhar = (id: number, overrides: PlanilharTipDto) => {
    setPlanilhando(null);
    planilhar.mutate(
      { id, ...overrides },
      {
        onSuccess: (res: { alreadyExisted: boolean }) =>
          actionToast.success({
            title: res.alreadyExisted ? "Essa tip já estava planilhada" : "Aposta planilhada",
          }),
        onError: (e: Error) => actionToast.error({ description: e.message }),
      },
    );
  };

  // Recarregar é puxar a lista pra baixo, como no resto do app — não sobra
  // botão de reload competindo com o "..." na largura do header.
  const pull = usePullToRefresh(() => refetch(), isMobile);

  // Mesmos chips nos dois lugares: no desktop moram no header (a fila ocupa a
  // largura toda abaixo), no mobile ficam acima da lista.
  const abas = (
    <div className="flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => setTab(t.value)}
          className={cn(
            "press h-9 shrink-0 rounded-full px-3 text-[13px] font-medium transition-colors",
            tab === t.value
              ? "bg-accent text-white"
              : "border border-foreground/10 bg-transparent text-zinc-400 hover:text-foreground",
          )}
        >
          {t.label}
          {summary && <span className="ml-1.5 tabular-nums opacity-60">{summary[t.countKey]}</span>}
        </button>
      ))}
    </div>
  );

  const subtitle = summary
    ? `${summary.pending} ${summary.pending === 1 ? "tip" : "tips"}${
        summary.pendingStake > 0 ? ` · ${formatCurrencyCompact(summary.pendingStake)} sugeridos` : ""
      }`
    : undefined;

  return (
    <MainLayout
      title="Tips"
      hideBottomNav={checkedTips.length > 0}
      subtitle={subtitle}
      actions={
        <div className="hidden items-center gap-2 md:flex">
          {abas}
          {/* No desktop nao ha pull-to-refresh: a tip chega de fora do app, e
              sem isso a unica forma de buscar a proxima e' recarregar a pagina. */}
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Atualizar tips"
            className="press flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 text-zinc-400 transition-colors hover:text-foreground disabled:opacity-50"
          >
            <ArrowsClockwise size={16} weight="bold" className={cn(isFetching && "animate-spin")} />
          </button>
        </div>
      }
      titleWrapperClassName="flex flex-col gap-0.5 min-w-0"
      titleClassName="text-2xl font-semibold tracking-tight"
      subtitleClassName="text-sm text-zinc-500 truncate"
      mobileHeader={
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Tips</h1>
          {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
        </div>
      }
    >
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />

      {/* Busca sempre aberta, sem botao de alternar no header: reusa a barra
          de Apostas, e do lado dela mora a multi-selecao de casas. */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 md:max-w-sm">
          <MobileSearchBar
            value={busca}
            onChange={setBusca}
            resultsCount={total}
            open
            onClose={() => setBusca("")}
            inputRef={buscaRef}
            placeholder="Buscar por evento ou mercado..."
          />
        </div>

        {/* Mesma caixa dos filtros de Apostas pra barra não ficar com dois
            controles de altura diferente. */}
        <div className="hidden h-11 shrink-0 items-center rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3.5 md:flex">
          <HouseMultiSelect
            houses={houses}
            selected={houseIds}
            onChange={setHouseIds}
            label="Casas"
          />
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 overflow-x-auto md:hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {abas}
        <button
          type="button"
          onClick={() => setCasaSheetOpen(true)}
          className={cn(
            "press flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors",
            houseIds.length > 0
              ? "bg-accent text-white"
              : "border border-foreground/10 bg-transparent text-zinc-400",
          )}
        >
          <Buildings size={13} /> Casas
          {houseIds.length > 0 && <span className="tabular-nums opacity-75">{houseIds.length}</span>}
        </button>
      </div>

      {canSelect && tips.length > 0 && (
        <div className="mb-3 flex items-center gap-3 text-sm">
          <label className="flex min-h-11 cursor-pointer items-center gap-2">
            <Checkbox aria-label="Selecionar todas da página"
              checked={allChecked ? true : checkedTips.length > 0 ? "indeterminate" : false}
              onCheckedChange={() => {
                selectionAnchor.current = null;
                setCheckedIds(allChecked ? new Set() : new Set(tips.map((tip) => tip.id)));
              }} />
            Selecionar todas da página ({tips.length})
          </label>
          <span className="hidden text-xs text-zinc-500 md:inline">Shift + clique seleciona um intervalo</span>
        </div>
      )}

      {isPending ? (
        <div className="space-y-2" role="status" aria-label="Carregando tips">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" delay={i * 60} />
          ))}
        </div>
      ) : tips.length === 0 ? (
        <EmptyState
          icon={tab === "pending" ? <CheckCircle size={32} /> : <PaperPlaneTilt size={32} />}
          {...(buscaDebounced || houseIds.length > 0
            ? {
                title: "Nada encontrado",
                description: buscaDebounced
                  ? `Nenhuma tip com "${buscaDebounced}" nesta aba.`
                  : "Nenhuma tip das casas selecionadas nesta aba.",
              }
            : emptyByTab[tab])}
        />
      ) : (
        <>
          {/* Desktop: fila à esquerda, detalhe fixo à direita — a largura sobra
              e abrir um sheet por tip custaria um ida-e-volta por linha. */}
          <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_380px] md:items-start md:gap-5">
            <div className="min-w-0">
              <TipsListDesktop
                tips={tips}
                selectedId={selecionada?.id ?? null}
                onSelect={(tip) => {
                  setSelecionadaId(tip.id);
                  selectionAnchor.current = tip.id;
                }}
                checkedIds={checkedIds}
                onToggle={canSelect ? toggleChecked : undefined}
              />
            </div>

            {selecionada && (
              <TipDetailPanel
                key={selecionada.id}
                tip={selecionada}
                onPlanilhar={() => setPlanilhando(selecionada)}
                onDismiss={() => run(dismiss, selecionada.id, "Tip marcada como caiu")}
                onUndismiss={() => run(undismiss, selecionada.id, "Tip devolvida para a fila")}
                hasSelection={checkedTips.length > 0}
              />
            )}
          </div>

          <div className="md:hidden">
            {/* Container único com divisórias, não cards soltos: a fila é pra
                varrer de cima a baixo, e sombra por item vira ruído nisso. */}
            <div className="overflow-hidden rounded-xl border border-border">
              {tips.map((tip) => (
                <div
                  key={tip.id}
                  className={cn(
                    "relative border-b border-border transition-colors last:border-b-0",
                    checkedIds.has(tip.id) &&
                      "bg-accent/[0.16] shadow-[inset_4px_0_0_0_var(--color-accent)]",
                  )}
                >
                {canSelect && (
                  <label className="flex min-h-11 items-center gap-2 px-4 pt-2 text-xs text-zinc-400">
                    <Checkbox checked={checkedIds.has(tip.id)} onCheckedChange={() => toggleChecked(tip.id)}
                      aria-label={`Selecionar ${tip.game ?? "tip"} (${tip.id})`} />
                    Selecionar
                  </label>
                )}
                <fieldset className="min-w-0">
                <TipCard
                  key={tip.id}
                  tip={tip}
                  onPlanilhar={() => setPlanilhando(tip)}
                  onDismiss={() => run(dismiss, tip.id, "Tip marcada como caiu")}
                  onUndismiss={() => run(undismiss, tip.id, "Tip devolvida para a fila")}
                />
                </fieldset>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Mesma barra flutuante da tela de Apostas (BulkActionBar): o espaçador
          evita que ela cubra o último item da fila. */}
      {checkedTips.length > 0 && <div className="h-32" aria-hidden="true" />}
      <TipsBulkActionBar
        count={checkedTips.length}
        loading={false}
        variant={tab === "pending" ? "pending" : "caiu"}
        onPlanilhar={() => setBatchReview([...checkedTips])}
        onDismiss={() => runBatch("dismiss")}
        onUndismiss={() => runBatch("undismiss")}
        onCancel={clearSelection}
      />

      <Dialog open={batchReview !== null} onOpenChange={(open) => !open && setBatchReview(null)}>
        <DialogContent aria-describedby="batch-description" className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Planilhar {batchReview?.length} tips</DialogTitle>
            <p id="batch-description" className="text-sm text-zinc-400">Confirme as apostas realizadas. Cada tip usará a stake, odd e casa exibidas abaixo.</p>
          </DialogHeader>
          <ul className="max-h-[40dvh] space-y-3 overflow-y-auto text-sm">
            {batchReview?.map((tip) => (
              <li key={tip.id}>
                <p className="font-medium">{tip.game ?? "Jogo não identificado"}</p>
                <p className="text-xs text-zinc-400">{tip.market}</p>
                <p className="text-zinc-400">{tip.house ?? "Casa não reconhecida"} · Odd {tip.odd ?? "—"} · {tip.recommendedStake !== null ? formatCurrency(tip.recommendedStake) : "Stake não informada"}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm">Stake total: {formatCurrency(batchReview?.reduce((sum, tip) => sum + (tip.recommendedStake ?? 0), 0) ?? 0)}</p>
          <Button className="border-transparent bg-[#12a05c] text-white hover:bg-[#0e8a4e]"
            onClick={() => batchReview && runBatch("planilhar", batchReview)}>
            Confirmar e planilhar
          </Button>
        </DialogContent>
      </Dialog>

      <CasaSheet
        nested={false}
        open={casaSheetOpen}
        onOpenChange={setCasaSheetOpen}
        houses={houses}
        houseIds={houseIds}
        onChange={setHouseIds}
      />

      {/* key remonta o sheet a cada tip: os campos são inicializados no
          useState a partir dela, então sem isso a segunda abriria com os
          valores da primeira. */}
      {planilhando &&
        (isMobile ? (
        <TipPlanilharSheet
          key={planilhando.id}
          tip={planilhando}
          open
          onOpenChange={(o) => !o && setPlanilhando(null)}
          onConfirm={(overrides) => doPlanilhar(planilhando.id, overrides)}
          onDismiss={() => run(dismiss, planilhando.id, "Tip marcada como caiu")}
          busy={false}
        />
        ) : (
          <TipPlanilharDialog
            key={planilhando.id}
            tip={planilhando}
            open
            onOpenChange={(o) => !o && setPlanilhando(null)}
            onConfirm={(overrides) => doPlanilhar(planilhando.id, overrides)}
            onDismiss={() => run(dismiss, planilhando.id, "Tip marcada como caiu")}
            busy={false}
          />
        ))}
    </MainLayout>
  );
}
