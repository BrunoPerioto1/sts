import { MainLayout } from "@/components/layout/MainLayout";
import { AdminTipSources } from "@/components/admin/AdminTipSources";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminSourcesPage() {
  return (
    <MainLayout
      title="Admin"
      subtitle="Fontes de tips"
      mobileHeader={<PageHeader back="/profile" title="Fontes de tips" subtitle="Modelo das mensagens de cada tipster" />}
    >
      <AdminTipSources />
    </MainLayout>
  );
}
