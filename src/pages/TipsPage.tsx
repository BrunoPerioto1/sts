import { useState } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TipCard } from "@/components/tips/TipCard";
import { TipEditSheet } from "@/components/tips/TipEditSheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { actionToast } from "@/lib/action-toast";
import { formatCurrencyCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTipActions, useTips } from "@/hooks/queries/use-tips";
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
    description: "As tips que virarem aposta aparecem aqui com o resultado em Apostas.",
  },
  caiu: {
    title: "Nenhuma marcada como caiu",
    description: "Tips que você descartar ficam guardadas aqui, e dá para devolver para a fila.",
  },
};

export default function TipsPage() {
  const [tab, setTab] = useState<TipStatus>("pending");
  const [editing, setEditing] = useState<TipItem | null>(null);
  const { tips, summary, total, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useTips(tab);
  const { dismiss, undismiss, planilhar } = useTipActions();

  const busy = dismiss.isPending || undismiss.isPending || planilhar.isPending;

  const run = (mutation: typeof dismiss, id: number, title: string) =>
    mutation.mutate(id, {
      onSuccess: () => actionToast.success({ title }),
      onError: (e: Error) => actionToast.error({ description: e.message }),
    });

  const doPlanilhar = (id: number, overrides: PlanilharTipDto = {}) =>
    planilhar.mutate(
      { id, ...overrides },
      {
        onSuccess: (res: { alreadyExisted: boolean }) => {
          setEditing(null);
          actionToast.success({
            title: res.alreadyExisted ? "Essa tip já estava planilhada" : "Aposta planilhada",
          });
        },
        onError: (e: Error) => actionToast.error({ description: e.message }),
      },
    );

  const subtitle = summary
    ? `${summary.pending} pendentes${summary.pendingStake > 0 ? ` · ${formatCurrencyCompact(summary.pendingStake)} sugeridos` : ""}`
    : undefined;

  const header = (
    <div className="flex items-baseline gap-2.5">
      <h1 className="text-2xl font-semibold tracking-tight">Tips</h1>
      {subtitle && <span className="text-sm text-zinc-500">{subtitle}</span>}
    </div>
  );

  return (
    <MainLayout
      title="Tips"
      subtitle={subtitle}
      titleWrapperClassName="flex items-baseline gap-2.5 min-w-0"
      titleClassName="text-2xl font-semibold tracking-tight shrink-0"
      subtitleClassName="text-sm text-zinc-500 truncate"
      mobileHeader={header}
    >
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "press h-8 rounded-full px-3 text-xs font-medium transition-colors",
              tab === t.value
                ? "bg-accent/[0.14] text-accent border border-accent/30"
                : "border border-border text-zinc-400 hover:text-foreground"
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
        <EmptyState icon={<PaperPlaneTilt size={32} />} {...emptyByTab[tab]} />
      ) : (
        <div className="space-y-2">
          {tips.map((tip, index) => (
            <TipCard
              key={tip.id}
              tip={tip}
              index={index}
              busy={busy}
              onDismiss={() => run(dismiss, tip.id, "Tip marcada como caiu")}
              onUndismiss={() => run(undismiss, tip.id, "Tip devolvida para a fila")}
              onPlanilhar={() => doPlanilhar(tip.id)}
              onEdit={() => setEditing(tip)}
            />
          ))}
          {hasNextPage && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Carregando…" : `Carregar mais (${tips.length} de ${total})`}
            </Button>
          )}
        </div>
      )}

      {/* key remonta o sheet a cada tip: os campos são inicializados no
          useState a partir dela, então sem isso a segunda tip abriria com os
          valores da primeira. */}
      {editing && (
        <TipEditSheet
          key={editing.id}
          tip={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          onConfirm={(overrides) => doPlanilhar(editing.id, overrides)}
          busy={planilhar.isPending}
        />
      )}
    </MainLayout>
  );
}
