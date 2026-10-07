import { MainLayout } from "@/components/layout/MainLayout";
import { AdminScanner } from "@/components/admin/AdminScanner";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminScannerPage() {
  return (
    <MainLayout
      title="Admin"
      subtitle="Scanner SofaScore"
      mobileHeader={<PageHeader back="/profile" title="Scanner" subtitle="SofaScore" />}
    >
      <AdminScanner />
    </MainLayout>
  );
}
