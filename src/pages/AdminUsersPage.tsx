import { MainLayout } from "@/components/layout/MainLayout";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminMobileHeader } from "@/components/admin/AdminPanel";
import { useAdminUsers } from "@/hooks/queries/use-admin";

export default function AdminUsersPage() {
  const { data: users } = useAdminUsers();
  const admins = users?.filter((u) => u.roleId === 1).length ?? 0;

  return (
    <MainLayout
      title="Admin"
      subtitle="Usuários"
      mobileHeader={
        <AdminMobileHeader
          title="Usuários"
          subtitle={users && `${users.length} ${users.length === 1 ? "conta" : "contas"} · ${admins} ${admins === 1 ? "admin" : "admins"}`}
        />
      }
    >
      <AdminUsers />
    </MainLayout>
  );
}
