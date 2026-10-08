import { useState } from "react";
import { Link } from "react-router-dom";
import { PencilSimple, Plus, Trash, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { useDeleteTipSource, useTipSources, useToggleTipSource } from "@/hooks/queries/use-tip-sources";
import { actionToast } from "@/lib/action-toast";
import { formatSaoPaulo } from "@/lib/admin-health";
import { formatInt } from "@/lib/format";
import type { TipSource } from "@/api/routes/tip-sources";
import { cn } from "@/lib/utils";

const ICON_BUTTON =
  "w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/[0.07] transition";

/**
 * Fontes de tips: cada tipster que o repasse copia pro grupo Tips, com o
 * modelo das mensagens dele. O cadastro em si é a tela de edição.
 */
export function AdminTipSources() {
  const { data, isPending, isError, refetch } = useTipSources();
  const toggle = useToggleTipSource();
  const remove = useDeleteTipSource();
  const [deleting, setDeleting] = useState<TipSource | null>(null);

  const newButton = (
    <Button size="sm" asChild>
      <Link to="/admin/sources/new">
        <Plus size={14} /> Nova fonte
      </Link>
    </Button>
  );

  const active = data?.filter((s) => s.isActive).length ?? 0;

  return (
    <>
      <AdminPanel
        eyebrow="Tips"
        title={!data ? "Fontes de tips" : `${formatInt(active)} ${active === 1 ? "fonte ativa" : "fontes ativas"}`}
        description="Mensagem que o modelo de uma fonte lê vira o card padrão antes do fan-out. A que nenhum modelo lê segue no formato de sempre."
        actions={newButton}
      >
        {isPending ? (
          <div className="p-4 sm:p-6 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" delay={i * 60} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            bare
            title="Não foi possível carregar as fontes"
            action={
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            }
          />
        ) : data.length === 0 ? (
          <EmptyState
            bare
            title="Nenhuma fonte cadastrada"
            description="Toda tip segue no formato padrão (🏠 🆚 📌 🏷). Cadastre uma fonte quando o repasse trouxer tips de um tipster com outro formato."
            action={newButton}
          />
        ) : (
          <ul className="divide-y divide-border">
            {data.map((source) => (
              <li key={source.id} className="px-4 py-3 sm:px-6 flex items-center gap-3">
                <Checkbox
                  aria-label={source.isActive ? `Pausar ${source.name}` : `Ativar ${source.name}`}
                  checked={source.isActive}
                  onCheckedChange={(v) =>
                    toggle.mutate(
                      { id: source.id, isActive: v === true },
                      { onError: (e) => actionToast.error({ description: (e as Error).message }) },
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <Link
                      to={`/admin/sources/${source.id}`}
                      className={cn("font-medium hover:underline", !source.isActive && "opacity-50")}
                    >
                      {source.name}
                    </Link>
                    {!source.isActive && <span className="text-[11px] uppercase tracking-wider text-muted">pausada</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span className="tabular-nums">
                      {formatInt(source.recentTips)} {source.recentTips === 1 ? "tip" : "tips"} em 7 dias
                    </span>
                    {source.lastTipAt && <span>última {formatSaoPaulo(source.lastTipAt)}</span>}
                    {source.mutedBy > 0 && (
                      <span>
                        desligada por {formatInt(source.mutedBy)} {source.mutedBy === 1 ? "usuário" : "usuários"}
                      </span>
                    )}
                    {!source.template.marker && (
                      <span className="inline-flex items-center gap-1 text-warning">
                        <Warning size={12} /> sem identificador
                      </span>
                    )}
                  </p>
                </div>
                <Link to={`/admin/sources/${source.id}`} aria-label={`Editar ${source.name}`} className={ICON_BUTTON}>
                  <PencilSimple size={16} />
                </Link>
                <button
                  type="button"
                  aria-label={`Apagar ${source.name}`}
                  className={cn(ICON_BUTTON, "hover:text-danger")}
                  onClick={() => setDeleting(source)}
                >
                  <Trash size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              As tips que ela já leu continuam, com o card traduzido. Mensagens novas desse tipster deixam de ser
              reconhecidas e seguem no formato padrão. Para parar só por um tempo, desmarque a fonte em vez de apagar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleting) return;
                const { id, name } = deleting;
                remove.mutate(id, {
                  onSuccess: () => actionToast.success({ title: `“${name}” apagada` }),
                  onError: (e) => actionToast.error({ description: (e as Error).message }),
                });
              }}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
