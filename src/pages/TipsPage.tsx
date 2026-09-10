import { useEffect, useRef, useState } from "react";
import { ArrowsClockwise, CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TipCard } from "@/components/tips/TipCard";
import { TipPlanilharSheet } from "@/components/tips/TipPlanilharSheet";
import { TipPlanilharDialog } from "@/components/tips/TipPlanilharDialog";
import { MobileSearchBar } from "@/components/apostas/MobileSearchHeader";
import { TipsListDesktop } from "@/components/tips/TipsListDesktop";
import { TipDetailPanel } from "@/components/tips/TipDetailPanel";
import { Button } from "@/components/ui/button";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { actionToast } from "@/lib/action-toast";
import { formatCurrencyCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTipActions, useTips } from "@/hooks/queries/use-tips";
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
    description: "Nada esperando você. Avisamos aqui quando o canal mandar a próxima tip.",
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
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useTips(tab, buscaDebounced || undefined);

  // Só no desktop: a linha clicada abre o painel da direita. Guarda o id, não
  // a tip — depois de planilhar/descartar a lista é refeita, e um objeto
  // guardado ficaria com o status velho.
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const selecionada = tips.find((t) => t.id === selecionadaId) ?? tips[0] ?? null;
  const { dismiss, undismiss, planilhar } = useTipActions();

  const run = (mutation: typeof dismiss, id: number, title: string) =>
    mutation.mutate(id, {
      onSuccess: () => {
        setPlanilhando(null);
        actionToast.success({ title });
      },
      onError: (e: Error) => actionToast.error({ description: e.message }),
    });

  const doPlanilhar = (id: number, overrides: PlanilharTipDto) =>
    planilhar.mutate(
      { id, ...overrides },
      {
        onSuccess: (res: { alreadyExisted: boolean }) => {
          setPlanilhando(null);
          actionToast.success({
            title: res.alreadyExisted ? "Essa tip já estava planilhada" : "Aposta planilhada",
          });
        },
        onError: (e: Error) => actionToast.error({ description: e.message }),
      },
    );

  // Recarregar é puxar a lista pra baixo, como no resto do app — não sobra
  // botão de reload competindo com o "..." na largura do header.
  const pull = usePullToRefresh(() => refetch(), isMobile);

  const carregarMais = hasNextPage ? (
    <Button
      variant="outline"
      className="mt-3 w-full"
      onClick={() => void fetchNextPage()}
      disabled={isFetchingNextPage}
    >
      {isFetchingNextPage ? "Carregando…" : `Carregar mais (${tips.length} de ${total})`}
    </Button>
  ) : null;

  // Mesmos chips nos dois lugares: no desktop eles moram no header (a fila
  // ocupa a largura toda abaixo), no mobile ficam acima da lista.
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
              : "border border-white/10 bg-transparent text-zinc-400 hover:text-foreground",
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
            className="press flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:text-foreground disabled:opacity-50"
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

      {/* Sempre aberta, sem botao de alternar no header: aqui a busca e' o
          unico filtro da tela alem das abas. Reusa a barra de Apostas. */}
      <div className="md:max-w-sm">
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

      <div className="mb-4 md:hidden">{abas}</div>

      {isPending ? (
        <div className="space-y-2" role="status" aria-label="Carregando tips">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" delay={i * 60} />
          ))}
        </div>
      ) : tips.length === 0 ? (
        <EmptyState
          icon={tab === "pending" ? <CheckCircle size={32} /> : <PaperPlaneTilt size={32} />}
          {...(buscaDebounced
            ? {
                title: "Nada encontrado",
                description: `Nenhuma tip com "${buscaDebounced}" nesta aba.`,
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
                onSelect={(tip) => setSelecionadaId(tip.id)}
              />
              {carregarMais}
            </div>

            {selecionada && (
              <TipDetailPanel
                tip={selecionada}
                onPlanilhar={() => setPlanilhando(selecionada)}
                onDismiss={() => run(dismiss, selecionada.id, "Tip marcada como caiu")}
                onUndismiss={() => run(undismiss, selecionada.id, "Tip devolvida para a fila")}
              />
            )}
          </div>

          <div className="md:hidden">
            {/* Container único com divisórias, não cards soltos: a fila é pra
                varrer de cima a baixo, e sombra por item vira ruído nisso. */}
            <div className="overflow-hidden rounded-xl border border-border">
              {tips.map((tip) => (
                <TipCard
                  key={tip.id}
                  tip={tip}
                  onPlanilhar={() => setPlanilhando(tip)}
                  onDismiss={() => run(dismiss, tip.id, "Tip marcada como caiu")}
                  onUndismiss={() => run(undismiss, tip.id, "Tip devolvida para a fila")}
                />
              ))}
            </div>
            {carregarMais}
          </div>
        </>
      )}

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
          busy={planilhar.isPending}
        />
        ) : (
          <TipPlanilharDialog
            key={planilhando.id}
            tip={planilhando}
            open
            onOpenChange={(o) => !o && setPlanilhando(null)}
            onConfirm={(overrides) => doPlanilhar(planilhando.id, overrides)}
            onDismiss={() => run(dismiss, planilhando.id, "Tip marcada como caiu")}
            busy={planilhar.isPending}
          />
        ))}
    </MainLayout>
  );
}
