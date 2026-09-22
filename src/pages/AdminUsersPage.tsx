import { MainLayout } from "@/components/layout/MainLayout";
import { AdminUsers } from "@/components/admin/AdminUsers";

export default function AdminUsersPage() {
  return (
    <MainLayout title="Admin" subtitle="Usuários">
      <AdminUsers />
    </MainLayout>
  );
}
