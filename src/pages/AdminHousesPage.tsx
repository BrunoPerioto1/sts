import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdminHouses } from "@/components/admin/AdminHouses";
import { AdminHousesMobile } from "@/components/admin/AdminHousesMobile";
import { AdminMobileHeader } from "@/components/admin/AdminPanel";
import { useAdminHouses } from "@/hooks/queries/use-admin";
import { useIsMobile } from "@/hooks/use-mobile";
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
        <AdminMobileHeader
          title="Casas de aposta"
          subtitle={houses ? `${houses.length} no catálogo · vale para todos` : "vale para todos"}
          action={
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="press h-9 px-3 rounded-[10px] border border-accent text-accent-text text-[13.5px] flex items-center gap-1.5"
            >
              <Plus size={14} /> Nova
            </button>
          }
        />
      }
    >
      {isMobile ? <AdminHousesMobile editing={editing} setEditing={setEditing} /> : <AdminHouses />}
    </MainLayout>
  );
}
