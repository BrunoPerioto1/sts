import { MainLayout } from "@/components/layout/MainLayout";
import { AdminHouses } from "@/components/admin/AdminHouses";

export default function AdminHousesPage() {
  return (
    <MainLayout title="Admin" subtitle="Casas de apostas">
      <AdminHouses />
    </MainLayout>
  );
}
