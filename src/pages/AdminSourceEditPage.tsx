import { Link, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSkeleton } from "@/components/ui/skeleton";
import { TipSourceEditor } from "@/components/admin/TipSourceEditor";
import { useTipSources } from "@/hooks/queries/use-tip-sources";

/** /admin/sources/new e /admin/sources/:id. */
export default function AdminSourceEditPage() {
  const { id } = useParams();
  const isNew = id === undefined;
  // A lista já traz o modelo de cada fonte: sem rota de detalhe.
  const sources = useTipSources();
  const source = isNew ? undefined : sources.data?.find((s) => s.id === Number(id));
  const title = isNew ? "Nova fonte" : (source?.name ?? "Fonte");

  return (
    <MainLayout
      title={title}
      subtitle="Fontes de tips"
      hideBottomNav
      mobileHeader={<PageHeader back="/admin/sources" title={title} subtitle="Fontes de tips" />}
    >
      {isNew ? (
        <TipSourceEditor />
      ) : sources.isPending ? (
        <FormSkeleton fields={4} />
      ) : source ? (
        // key: trocar de fonte pela URL recomeça o formulário.
        <TipSourceEditor key={source.id} source={source} />
      ) : (
        <EmptyState
          title="Fonte não encontrada"
          description="Ela pode ter sido apagada."
          action={
            <Button variant="secondary" size="sm" asChild>
              <Link to="/admin/sources">Ver fontes</Link>
            </Button>
          }
        />
      )}
    </MainLayout>
  );
}
