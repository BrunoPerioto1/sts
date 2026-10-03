import { MainLayout } from "@/components/layout/MainLayout";
import { AdminScanner } from "@/components/admin/AdminScanner";

export default function AdminScannerPage() {
  return (
    <MainLayout title="Admin" subtitle="Scanner SofaScore">
      <AdminScanner />
    </MainLayout>
  );
}
