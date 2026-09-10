import { useState } from "react";
import { CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TipCard } from "@/components/tips/TipCard";
import { TipPlanilharSheet } from "@/components/tips/TipPlanilharSheet";
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
  const { tips, summary, total, isPending, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useTips(tab);
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

  const subtitle = summary
    ? `${summary.pending} ${summary.pending === 1 ? "tip" : "tips"}${
        summary.pendingStake > 0 ? ` · ${formatCurrencyCompact(summary.pendingStake)} sugeridos` : ""
      }`
    : undefined;

  return (
    <MainLayout
      title="Pendentes"
      subtitle={subtitle}
      titleWrapperClassName="flex flex-col gap-0.5 min-w-0"
      titleClassName="text-2xl font-semibold tracking-tight"
      subtitleClassName="text-sm text-zinc-500 truncate"
      mobileHeader={
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Pendentes</h1>
          {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
        </div>
      }
    >
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            // Azul sólido no selecionado, igual ao filtro de status em Apostas.
            // Um pouco mais baixo que lá (h-9): aqui os chips dividem a tela
            // com a fila, não são o controle principal.
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

      {isPending ? (
        <div className="space-y-2" role="status" aria-label="Carregando tips">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" delay={i * 60} />
          ))}
        </div>
      ) : tips.length === 0 ? (
        <EmptyState
          icon={tab === "pending" ? <CheckCircle size={32} /> : <PaperPlaneTilt size={32} />}
          {...emptyByTab[tab]}
        />
      ) : (
        <>
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

          {hasNextPage && (
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Carregando…" : `Carregar mais (${tips.length} de ${total})`}
            </Button>
          )}
        </>
      )}

      {/* key remonta o sheet a cada tip: os campos são inicializados no
          useState a partir dela, então sem isso a segunda abriria com os
          valores da primeira. */}
      {planilhando && (
        <TipPlanilharSheet
          key={planilhando.id}
          tip={planilhando}
          open
          onOpenChange={(o) => !o && setPlanilhando(null)}
          onConfirm={(overrides) => doPlanilhar(planilhando.id, overrides)}
          onDismiss={() => run(dismiss, planilhando.id, "Tip marcada como caiu")}
          busy={planilhar.isPending}
        />
      )}
    </MainLayout>
  );
}
