import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ArrowsClockwise, Buildings, CheckCircle, Clock, ListChecks, PaperPlaneTilt } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TipCardMobileItem } from "@/components/tips/TipCardMobileItem";
import { TipPlanilharSheet } from "@/components/tips/TipPlanilharSheet";
import { TipPlanilharDialog } from "@/components/tips/TipPlanilharDialog";
import { MobileSearchBar } from "@/components/apostas/MobileSearchHeader";
import { CasaSheet } from "@/components/apostas/CasaSheet";
import { HouseMultiSelect } from "@/components/house/HouseMultiSelect";
import { TipsListDesktop, type TipListGroup } from "@/components/tips/TipsListDesktop";
import { TipInicioSheet, TipStatusSheet } from "@/components/tips/TipFilterSheets";
import { groupPendingTips, TIP_GROUP_OPTIONS } from "@/lib/tip-schedule";
import { TipDetailPanel } from "@/components/tips/TipDetailPanel";
import { TipsBulkActionBar } from "@/components/tips/TipsBulkActionBar";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SearchField } from "@/components/ui/search-field";
import { SectionLabel } from "@/components/ui/section-label";
import { FilterChip, FilterChipRow } from "@/components/ui/filter-chips";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { actionToast } from "@/lib/action-toast";
import { formatMoney, formatOdd, houseDisplayName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTips } from "@/hooks/queries/use-tips";
import { useDebouncedValue, useTipPageActions, useTipSelection } from "@/hooks/tips/use-tips-page";
import { useHouses } from "@/hooks/queries/use-houses";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import type { PlanilharTipDto, TipItem, TipStatus } from "@/api/routes/get-tips";

const tabs: { value: TipStatus; label: string; description: string; countKey: "pending" | "planilhadas" | "caidas" }[] = [
  { value: "pending", label: "Pendentes", description: "Esperando planilhar ou marcar que caiu", countKey: "pending" },
  { value: "planilhada", label: "Planilhadas", description: "Viraram aposta", countKey: "planilhadas" },
  // "Caiu" = a odd saiu e a tip não foi apostada — não é aposta perdida.
  { value: "caiu", label: "Caíram", description: "Odd saiu antes de apostar", countKey: "caidas" },
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
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [inicioSheetOpen, setInicioSheetOpen] = useState(false);

  // Mesmo debounce da busca de Apostas (250 ms): sem ele cada tecla vira uma
  // pagina nova no infinite query.
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebouncedValue(busca, 250);
  const buscaRef = useRef<HTMLInputElement>(null!);

  const {
    tips: tipsDoServidor,
    summary,
    total,
    isPending,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useTips(tab, buscaDebounced || undefined, houseIds);

  // Relógio da fila: "começa em 40 min" e a troca de bloco (dá tempo → já
  // começou) acompanham o tempo sem precisar recarregar.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Pendentes por horário do jogo; as outras abas seguem por chegada. A
  // lista achatada vira a ordem de tudo (primeira selecionada, shift+clique).
  // Filtro "Início" (a iniciar / sem horário / iniciados): só faz sentido na
  // fila pendente, que é a agrupada pelo relógio. Vazio = todos os blocos.
  const [inicio, setInicio] = useState<string[]>([]);
  const inicioAtivo = tab === "pending" && inicio.length > 0;
  const todosGrupos = useMemo(
    () => (tab === "pending" ? groupPendingTips(tipsDoServidor, now) : null),
    [tab, tipsDoServidor, now],
  );
  const grupos = useMemo(
    () => (todosGrupos && inicio.length > 0 ? todosGrupos.filter((g) => inicio.includes(g.id)) : todosGrupos),
    [todosGrupos, inicio],
  );
  // Contagem de cada bloco antes do filtro: é o que as opções de Início mostram.
  const contagemInicio = Object.fromEntries((todosGrupos ?? []).map((g) => [g.id, g.tips.length]));
  const tips = useMemo(() => (grupos ? grupos.flatMap((g) => g.tips) : tipsDoServidor), [grupos, tipsDoServidor]);

  // Só no desktop: a linha clicada abre o painel da direita. Guarda o id, não
  // a tip — depois de planilhar/descartar a lista é refeita, e um objeto
  // guardado ficaria com o status velho.
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const selecionada = tips.find((t) => t.id === selecionadaId) ?? tips[0] ?? null;
  const [batchReview, setBatchReview] = useState<TipItem[] | null>(null);
  const canSelect = tab !== "planilhada";
  const selection = useTipSelection(tips, [tab, buscaDebounced, houseIds.join(","), inicio.join(",")].join("|"));
  const { checkedIds, setCheckedIds, checkedTips, allChecked } = selection;
  const toggleChecked = selection.toggle;
  const clearSelection = selection.clear;
  // Trocar aba/filtro também fecha a revisão do lote.
  useEffect(() => setBatchReview(null), [tab, buscaDebounced, houseIds, inicio]);

  const { dismiss, undismiss, runBatch: runBatchWith, run, doPlanilhar } = useTipPageActions({
    onStart: () => setPlanilhando(null),
  });
  const runBatch = (action: "planilhar" | "dismiss" | "undismiss", items = checkedTips) =>
    runBatchWith(action, items, () => {
      setBatchReview(null);
      clearSelection();
    });

  // Jogo que já começou quase sempre é tip perdida: um clique limpa o bloco.
  // Não mexe em saldo nem cria aposta, e a aba Caíram devolve qualquer uma.
  const marcarComecadas = (items: TipItem[]) => (
    <button
      type="button"
      onClick={() => runBatch("dismiss", items)}
      className="press ml-2 rounded-md border border-foreground/10 px-2 py-1 text-xs text-zinc-300 hover:text-foreground"
    >
      Marcar {items.length === 1 ? "como caiu" : `as ${items.length} como caiu`}
    </button>
  );

  const gruposDaLista: TipListGroup[] | undefined = grupos?.map((g) => ({
    key: g.id,
    label: g.label,
    hint:
      g.id === "upcoming"
        ? "por horário de início"
        : g.id === "started"
          ? "odd provavelmente indisponível"
          : "confronto não reconhecido",
    tips: g.tips,
    action: g.id === "started" ? marcarComecadas(g.tips) : undefined,
  }));

  // Recarregar é puxar a lista pra baixo, como no resto do app — não sobra
  // botão de reload competindo com o "..." na largura do header.
  const pull = usePullToRefresh(() => refetch(), isMobile);

  const stakeSugerida =
    summary && summary.pendingStake > 0 ? ` · ${formatMoney(summary.pendingStake, { cents: false })} em stake sugerida` : "";
  const subtitle = summary ? `${summary.pending} ${summary.pending === 1 ? "tip" : "tips"}${stakeSugerida}` : undefined;

  const statusOptions = tabs.map((t) => ({ value: t.value, label: t.label, description: t.description, count: summary?.[t.countKey] }));
  const casaResumo =
    houseIds.length === 0
      ? null
      : houseIds.length === 1
        ? houseDisplayName(houses.find((h) => h.id === houseIds[0])?.name ?? "1 casa")
        : `${houseIds.length} casas`;
  const toggleInicio = (id: string) =>
    setInicio(inicio.includes(id) ? inicio.filter((v) => v !== id) : [...inicio, id]);

  return (
    <MainLayout
      title="Tips"
      hideBottomNav={checkedTips.length > 0}
      hideHeaderBorder
      subtitle={subtitle}
      actions={
        // No desktop nao ha pull-to-refresh: a tip chega de fora do app, e sem
        // isso a unica forma de buscar a proxima e' recarregar a pagina. Texto
        // discreto com a hora da última busca, não um botão competindo.
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Atualizar tips"
          className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-foreground/[0.04] hover:text-zinc-300 disabled:opacity-60 md:flex"
        >
          <ArrowsClockwise size={13} className={cn(isFetching && "animate-spin")} />
          {isFetching ? "atualizando…" : dataUpdatedAt ? `atualizado ${format(dataUpdatedAt, "HH:mm")}` : "atualizar"}
        </button>
      }
      mobileHeader={
        <PageHeader
          title="Tips"
          // Números em destaque, rótulos apagados: o olho pega "40" e "R$ 1.631".
          subtitle={
            summary && (
              <>
                <span className="font-medium text-zinc-100 tabular-nums">
                  {summary.pending} {summary.pending === 1 ? "tip" : "tips"}
                </span>
                {summary.pendingStake > 0 && (
                  <>
                    {" · Stake sugerida "}
                    <span className="font-medium text-zinc-100 tabular-nums">
                      {formatMoney(summary.pendingStake, { cents: false })}
                    </span>
                  </>
                )}
              </>
            )
          }
        />
      }
    >
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />

      {/* Desktop: abas sublinhadas logo abaixo do título (são a visão da
          página), depois a linha de filtros, cada uma entre divisórias de
          largura cheia. */}
      <div role="tablist" className="-mx-6 -mt-6 hidden items-end gap-6 border-b border-border px-6 md:flex">
        {tabs.map((t) => {
          const ativa = tab === t.value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={ativa}
              onClick={() => setTab(t.value)}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 pb-2.5 text-sm transition-colors duration-150",
                ativa ? "border-accent font-medium text-foreground" : "border-transparent text-zinc-400 hover:text-foreground",
              )}
            >
              {t.label}
              {summary && (
                <span
                  className={cn(
                    "min-w-[20px] rounded px-1.5 py-px text-center text-[11px] tabular-nums leading-4",
                    ativa
                      ? "bg-accent/[0.22] text-foreground"
                      : "bg-foreground/[0.06] text-zinc-400",
                  )}
                >
                  {summary[t.countKey]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="-mx-6 hidden items-center gap-3 border-b border-border px-6 py-3.5 md:flex">
        <SearchField value={busca} onChange={setBusca} placeholder="Buscar evento ou mercado" className="h-10 w-[340px]" />

        <HouseMultiSelect
          houses={houses}
          selected={houseIds}
          onChange={setHouseIds}
          label="Casa"
          className="h-10 rounded-md border border-foreground/10 px-3 transition-colors hover:bg-foreground/[0.03]"
        />

        {tab === "pending" && (
          <>
            <span className="mx-1 h-5 w-px bg-foreground/10" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Início</span>
            <div className="flex items-center gap-0.5">
              {TIP_GROUP_OPTIONS.map((o) => {
                const ativo = inicio.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => toggleInicio(o.value)}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors duration-150",
                      ativo
                        ? "bg-accent/[0.14] text-foreground"
                        : "text-zinc-300 hover:bg-foreground/[0.04]",
                    )}
                  >
                    {o.label}
                    <span className="tabular-nums text-zinc-500">{contagemInicio[o.value] ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Mobile: busca e, embaixo, os filtros como chips com ícone. Cada chip
          abre um bottom sheet (mesmo padrão do de Casas). Chip preenchido =
          fora do padrão, pra ver de relance o que está filtrando. */}
      <div className="md:hidden">
        <MobileSearchBar
          value={busca}
          onChange={setBusca}
          resultsCount={total}
          open
          onClose={() => setBusca("")}
          inputRef={buscaRef}
          placeholder="Buscar por evento ou mercado..."
        />
        <FilterChipRow className="mb-4">
          <FilterChip
            opensSheet
            icon={ListChecks}
            active={tab !== "pending"}
            count={summary?.[tabs.find((t) => t.value === tab)!.countKey]}
            onClick={() => setStatusSheetOpen(true)}
          >
            {tabs.find((t) => t.value === tab)?.label}
          </FilterChip>
          <FilterChip opensSheet icon={Buildings} active={houseIds.length > 0} onClick={() => setCasaSheetOpen(true)}>
            {casaResumo ?? "Casas"}
          </FilterChip>
          {tab === "pending" && (
            <FilterChip
              opensSheet
              icon={Clock}
              active={inicio.length > 0}
              count={inicio.length > 1 ? inicio.length : undefined}
              onClick={() => setInicioSheetOpen(true)}
            >
              {inicio.length === 1 ? TIP_GROUP_OPTIONS.find((o) => o.value === inicio[0])?.label : "Início"}
            </FilterChip>
          )}
        </FilterChipRow>
      </div>

      {isPending ? (
        <div className="space-y-2" role="status" aria-label="Carregando tips">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" delay={i * 60} />
          ))}
        </div>
      ) : tips.length === 0 ? (
        <EmptyState
          icon={tab === "pending" ? <CheckCircle size={32} /> : <PaperPlaneTilt size={32} />}
          {...(buscaDebounced || houseIds.length > 0 || inicioAtivo
            ? {
                title: "Nada encontrado",
                description: buscaDebounced
                  ? `Nenhuma tip com "${buscaDebounced}" nesta aba.`
                  : houseIds.length > 0
                    ? "Nenhuma tip das casas selecionadas nesta aba."
                    : "Nenhuma tip no horário de início selecionado.",
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
                groups={gruposDaLista}
                selectedId={selecionada?.id ?? null}
                onSelect={(tip) => {
                  setSelecionadaId(tip.id);
                  selection.setAnchor(tip.id);
                }}
                checkedIds={checkedIds}
                onToggle={canSelect ? toggleChecked : undefined}
                selectAll={{
                  checked: allChecked ? true : checkedTips.length > 0 ? "indeterminate" : false,
                  onToggle: () => {
                    selection.setAnchor(null);
                    setCheckedIds(allChecked ? new Set() : new Set(tips.map((tip) => tip.id)));
                  },
                  count: tips.length,
                }}
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
            {(gruposDaLista ?? [{ key: "all", label: "", tips } as TipListGroup]).map((grupo) => (
            <section key={grupo.key} className="mb-6 last:mb-0">
            {grupo.label && (
              <SectionLabel className="mb-2" count={grupo.tips.length} action={grupo.action}>
                {grupo.label}
              </SectionLabel>
            )}
            <div className="overflow-hidden rounded-xl border border-border">
              {grupo.tips.map((tip) => (
                <TipCardMobileItem
                  key={tip.id}
                  tip={tip}
                  canSelect={canSelect}
                  selectionMode={checkedTips.length > 0}
                  checked={checkedIds.has(tip.id)}
                  onToggle={() => toggleChecked(tip.id)}
                  onPlanilhar={() => setPlanilhando(tip)}
                  onDismiss={() => run(dismiss, tip.id, "Tip marcada como caiu")}
                  onUndismiss={() => run(undismiss, tip.id, "Tip devolvida para a fila")}
                />
              ))}
            </div>
            </section>
            ))}
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
                <p className="text-zinc-400">{tip.house ? houseDisplayName(tip.house) : "Casa não reconhecida"} · Odd {tip.odd != null ? formatOdd(tip.odd) : "—"} · {tip.recommendedStake !== null ? formatMoney(tip.recommendedStake) : "Stake não informada"}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm">Stake total: {formatMoney(batchReview?.reduce((sum, tip) => sum + (tip.recommendedStake ?? 0), 0) ?? 0)}</p>
          <Button className="bg-success-solid hover:bg-success-solid/90" onClick={() => batchReview && runBatch("planilhar", batchReview)}>
            Confirmar e planilhar
          </Button>
        </DialogContent>
      </Dialog>

      <TipStatusSheet
        open={statusSheetOpen}
        onOpenChange={setStatusSheetOpen}
        value={tab}
        onChange={setTab}
        options={statusOptions}
      />
      <TipInicioSheet
        open={inicioSheetOpen}
        onOpenChange={setInicioSheetOpen}
        selected={inicio}
        onChange={setInicio}
        options={TIP_GROUP_OPTIONS.map((o) => ({ ...o, count: contagemInicio[o.value] ?? 0 }))}
      />
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
