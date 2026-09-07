import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CaretLeft, CaretRight, Lock, Trash } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { FormSkeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { ScreenFooter } from "@/components/perfil/ScreenFooter";
import { actionToast } from "@/lib/action-toast";
import { patchMe } from "@/api/routes/patch-me";
import { deleteMe } from "@/api/routes/delete-me";
import { useMe } from "@/hooks/queries/use-me";
import { getErrorMessage } from "@/lib/api-error";

export default function AccountPage() {
  const navigate = useNavigate();
  const { me, setMe } = useMe();
  const [form, setForm] = useState({ username: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Hidrata o form quando o usuario chega — do cache (instantaneo) ou da rede.
  useEffect(() => {
    if (me) setForm({ username: me.username, email: me.email });
  }, [me]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await patchMe(form);
      setMe(updated);
      actionToast.success({ title: "Dados atualizados" });
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao salvar.") });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (me) setForm({ username: me.username, email: me.email });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMe();
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao excluir a conta.") });
      setDeleting(false);
    }
  };

  return (
    <MainLayout
      title="Dados da conta"
      hideHeaderBorder
      hideBottomNav
      mobileHeader={
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={() => navigate(-1)} aria-label="Voltar" className="p-1 -ml-1 text-zinc-400 hover:text-white">
            <CaretLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold truncate">Dados da conta</h1>
        </div>
      }
    >
      {!me ? (
        <FormSkeleton fields={3} />
      ) : (
        // Sem `min-h` forçado: a tela termina onde o conteúdo termina e o
        // rodapé encosta no último item, em vez de sobrar vazio no meio.
        <div className="flex flex-col">
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal text-zinc-400">Nome</Label>
              <Input
                className="min-h-[48px] rounded-lg px-3.5"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal text-zinc-400">E-mail</Label>
              <Input
                className="min-h-[48px] rounded-lg px-3.5"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>

          <p className="text-xs uppercase tracking-wider text-zinc-500 mt-7 mb-2">Segurança</p>
          <div className="flex flex-col divide-y divide-border border-y border-border">
            <Link to="/profile/password" className="press h-14 flex items-center gap-3">
              <Lock size={19} className="text-zinc-400 shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-white truncate">Alterar senha</span>
                <span className="block text-xs text-zinc-500 truncate">pede a senha atual</span>
              </span>
              <CaretRight size={16} className="text-zinc-500 shrink-0" />
            </Link>

            <button type="button" onClick={() => setConfirmOpen(true)} className="press h-14 flex items-center gap-3 text-left">
              <Trash size={19} className="text-negative shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-negative truncate">Excluir conta</span>
                <span className="block text-xs text-zinc-500 truncate">apaga apostas, casas e histórico</span>
              </span>
              <CaretRight size={16} className="text-zinc-500 shrink-0" />
            </button>
          </div>

          <ScreenFooter onSave={handleSave} onDiscard={handleDiscard} saving={saving} />
        </div>
      )}

      {/* Confirmacao no padrao do app: sheet de baixo pra cima. Digitar o
          e-mail e' de proposito — excluir a conta apaga apostas, casas e
          historico, entao um toque so nao basta. */}
      <BottomSheet
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmEmail("");
        }}
        title="Excluir a conta?"
        footer={
          <div className="flex flex-col gap-2">
            <Button
              variant="destructive"
              className="w-full min-h-[48px] text-base"
              disabled={deleting || confirmEmail.trim().toLowerCase() !== me?.email.toLowerCase()}
              onClick={handleDelete}
            >
              {deleting ? "Excluindo…" : "Excluir para sempre"}
            </Button>
            <Button variant="ghost" className="w-full min-h-[44px]" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
          </div>
        }
      >
        <div className="pb-4 flex flex-col gap-3">
          <p className="text-sm text-zinc-400">
            Apaga suas apostas, saldos de casas e movimentações. Não dá pra desfazer nem recuperar depois.
          </p>
          <div className="space-y-1.5">
            <Label className="text-sm font-normal text-zinc-400">
              Digite <span className="text-foreground">{me?.email}</span> para confirmar
            </Label>
            <Input
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="seu@email.com"
              className="min-h-[48px] rounded-lg px-3.5"
              autoComplete="off"
            />
          </div>
        </div>
      </BottomSheet>
    </MainLayout>
  );
}
