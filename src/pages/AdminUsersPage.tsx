import { CaretLeft } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { PageHeader } from "@/components/ui/page-header";
import { useAdminUsers } from "@/hooks/queries/use-admin";
import { useUserPanel } from "@/hooks/admin/use-admin-users-view";
import { accountsHeadline } from "@/lib/admin-users";

export default function AdminUsersPage() {
  const { data: users } = useAdminUsers();
  const panel = useUserPanel();
  const admins = users?.filter((u) => u.roleId === 1).length ?? 0;
  // Com o detalhe aberto no celular, o voltar fecha o detalhe — e o nome da
  // pessoa já vem grande no topo do corpo, então o cabeçalho só diz de onde veio.
  const inDetail = !!users?.some((u) => u.id === panel.userId);

  return (
    <MainLayout
      title="Admin"
      subtitle="Usuários"
      mobileHeader={
        inDetail ? (
          <div className="flex items-center gap-1.5 min-h-11">
            <button
              type="button"
              onClick={panel.close}
              aria-label="Voltar para usuários"
              className="press -ml-2 h-11 w-11 shrink-0 flex items-center justify-center text-zinc-400 hover:text-foreground"
            >
              <CaretLeft size={20} />
            </button>
            <span className="text-[15px] font-medium text-zinc-400">Usuários</span>
          </div>
        ) : (
          <PageHeader back="/profile" title="Usuários" subtitle={users && accountsHeadline(users.length, admins)} />
        )
      }
    >
      <AdminUsers />
    </MainLayout>
  );
}
