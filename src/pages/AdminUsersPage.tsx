import { MainLayout } from "@/components/layout/MainLayout";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { PageHeader } from "@/components/ui/page-header";
import { formatInt } from "@/lib/format";
import { useAdminUsers } from "@/hooks/queries/use-admin";

export default function AdminUsersPage() {
  const { data: users } = useAdminUsers();
  const admins = users?.filter((u) => u.roleId === 1).length ?? 0;

  return (
    <MainLayout
      title="Admin"
      subtitle="Usuários"
      hideHeaderBorder
      mobileHeader={
        <PageHeader
          back="/profile"
          title="Usuários"
          subtitle={users && `${formatInt(users.length)} ${users.length === 1 ? "conta" : "contas"} · ${formatInt(admins)} ${admins === 1 ? "admin" : "admins"}`}
        />
      }
    >
      <AdminUsers />
    </MainLayout>
  );
}
