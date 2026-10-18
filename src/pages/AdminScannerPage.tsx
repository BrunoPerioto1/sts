import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdminScanner } from "@/components/admin/AdminScanner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useAdminScanner } from "@/hooks/queries/use-admin";
import { formatInt } from "@/lib/format";

export default function AdminScannerPage() {
  const { data } = useAdminScanner();
  // Mora aqui porque o + do celular fica no header, fora do AdminScanner.
  const [adding, setAdding] = useState(false);

  return (
    <MainLayout
      title="Admin"
      subtitle="Scanner SofaScore"
      mobileHeader={
        <PageHeader
          back="/profile"
          title="Scanner"
          subtitle={data ? `SofaScore · ${formatInt(data.length)} competições` : "SofaScore"}
          actions={
            // Só o ícone: o botão azul cheio competia com a busca logo abaixo.
            <Button
              variant="ghost"
              className="h-11 w-11 -mr-2 rounded-full p-0 [&_svg]:size-[21px]"
              onClick={() => setAdding((v) => !v)}
              aria-label="Nova competição"
              aria-expanded={adding}
            >
              <Plus />
            </Button>
          }
        />
      }
    >
      <AdminScanner adding={adding} setAdding={setAdding} />
    </MainLayout>
  );
}
