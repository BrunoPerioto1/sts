import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdminHouses } from "@/components/admin/AdminHouses";
import { AdminHousesMobile } from "@/components/admin/AdminHousesMobile";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useAdminHouses } from "@/hooks/queries/use-admin";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatInt } from "@/lib/format";
import type { AdminHouse } from "@/api/routes/get-admin";

export default function AdminHousesPage() {
  const isMobile = useIsMobile();
  const { data: houses } = useAdminHouses();
  const [editing, setEditing] = useState<AdminHouse | "new" | null>(null);

  return (
    <MainLayout
      title="Admin"
      subtitle="Casas de apostas"
      mobileHeader={
        <PageHeader
          // Admin entra pelo Perfil no celular: voltar leva pra lá.
          back="/profile"
          title="Casas de aposta"
          subtitle={houses ? `${formatInt(houses.length)} casas · catálogo compartilhado` : "catálogo compartilhado"}
          actions={
            // Tonal, não cheio: o azul sólido competia com o chip "Todas" ativo,
            // que tem a mesma cor, logo abaixo.
            <Button
              size="sm"
              variant="ghost"
              className="h-9 gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-3 font-medium hover:bg-accent/20"
              onClick={() => setEditing("new")}
            >
              <Plus size={16} weight="bold" /> Nova casa
            </Button>
          }
        />
      }
    >
      {isMobile ? <AdminHousesMobile editing={editing} setEditing={setEditing} /> : <AdminHouses />}
    </MainLayout>
  );
}
