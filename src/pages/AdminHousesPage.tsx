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
            <Button size="sm" className="gap-1.5" onClick={() => setEditing("new")}>
              <Plus size={14} /> Nova
            </Button>
          }
        />
      }
    >
      {isMobile ? <AdminHousesMobile editing={editing} setEditing={setEditing} /> : <AdminHouses />}
    </MainLayout>
  );
}
