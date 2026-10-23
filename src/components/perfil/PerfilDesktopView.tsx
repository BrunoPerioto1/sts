import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CalendarBlank, Key, Sparkle, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { displayName, initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { patchMe, type UpdateMeParams } from "@/api/routes/patch-me";
import { usePreferencesForm } from "@/hooks/use-preferences-form";
import { useMe } from "@/hooks/queries/use-me";
import { usePlan } from "@/hooks/queries/use-plan";
import type { MeResponse } from "@/api/routes/get-me";
import type { ProfileSummary } from "@/hooks/perfil/use-profile-summary";
import { BankrollSignalsCard } from "./BankrollSignalsCard";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { ExportDataCard } from "./ExportDataCard";
import { SETTINGS_CARD, SettingsActionRow, SettingsSection } from "./SettingsSection";
import { TelegramCard } from "./TelegramCard";

const labelClass = "text-[13px] font-normal text-zinc-400";

// "set. 2025": o "de" do toLocaleDateString ("set. de 2025") sobra na linha.
function memberSince(iso: string) {
  const date = new Date(iso);
  return `${date.toLocaleDateString("pt-BR", { month: "short" })} ${date.getFullYear()}`;
}

// Tema e Sair não moram aqui: os dois estão no menu da conta, na sidebar.
export function PerfilDesktopView({ me, summary }: { me: MeResponse; summary: ProfileSummary }) {
  const { setMe } = useMe();
  const { can } = usePlan();
  const prefsForm = usePreferencesForm(me, setMe);
  // "Nome" é o fullName: o username é gerado pelo servidor no cadastro.
  const [account, setAccount] = useState({ name: me.fullName ?? "", email: me.email, currentPassword: "" });
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Hidrata os dois formulários quando o usuario chega — do cache
  // (instantaneo), da rede ou da resposta do salvar.
  useEffect(() => {
    prefsForm.resetFrom(me);
    setAccount({ name: me.fullName ?? "", email: me.email, currentPassword: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // /profile#bankroll-title (checklist do dashboard, link de celular aberto
  // no desktop): rola até a seção. O navegador não acha sozinho porque a
  // página monta depois do /users/me.
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" });
  }, [hash]);

  const emailChanged = account.email !== me.email;
  const accountDirty = account.name !== (me.fullName ?? "") || emailChanged;
  const dirty = accountDirty || prefsForm.dirty;
  // E-mail é o login: o servidor só troca com a senha atual.
  const canSave =
    !saving && prefsForm.valid && account.name.trim() !== "" && (!emailChanged || account.currentPassword !== "");

  const handleSave = async () => {
    if (!canSave) return;
    const payload: UpdateMeParams = {};
    if (accountDirty) {
      payload.fullName = account.name.trim();
      payload.email = account.email;
      if (emailChanged) payload.currentPassword = account.currentPassword;
    }
    if (prefsForm.dirty) Object.assign(payload, prefsForm.buildPayload());
    setSaving(true);
    try {
      setMe(await patchMe(payload));
      actionToast.success({ title: "Alterações salvas" });
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao salvar.") });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    prefsForm.resetFrom(me);
    setAccount({ name: me.fullName ?? "", email: me.email, currentPassword: "" });
  };

  const name = displayName(me);

  return (
    <div className="max-w-[1060px] flex flex-col gap-10 pb-4">
      <SettingsSection id="profile-title" title="Perfil" description="Seus dados de acesso ao Trackton.">
        <div className={cn(SETTINGS_CARD, "divide-y divide-border")}>
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="h-10 w-10 shrink-0 rounded-full bg-accent/15 text-accent-text flex items-center justify-center text-sm font-semibold" aria-hidden="true">
              {initialsOf(name)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold truncate">{name}</p>
              <p className="text-[13px] text-zinc-400 truncate">{me.email}</p>
            </div>
            {me.createdAt && (
              <p className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-500">
                <CalendarBlank size={14} /> Membro desde {memberSince(me.createdAt)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="account-name" className={labelClass}>Nome</Label>
              <Input id="account-name" className="h-10 rounded-lg" value={account.name} onChange={(e) => setAccount((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-email" className={labelClass}>E-mail</Label>
              <Input id="account-email" type="email" className="h-10 rounded-lg" value={account.email} onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))} />
            </div>
            {emailChanged && (
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="account-password" className={labelClass}>Senha atual (para trocar o e-mail)</Label>
                <Input
                  id="account-password"
                  type="password"
                  autoComplete="current-password"
                  className="h-10 rounded-lg"
                  value={account.currentPassword}
                  onChange={(e) => setAccount((p) => ({ ...p, currentPassword: e.target.value }))}
                />
              </div>
            )}
          </div>

          <SettingsActionRow
            title="Senha"
            description="Troque a senha usada para entrar"
            action={
              <Button variant="secondary" size="sm" onClick={() => setPasswordOpen(true)}>
                <Key /> Alterar senha
              </Button>
            }
          />
          <SettingsActionRow
            danger
            title="Excluir conta"
            description="Apaga apostas, casas e histórico. Não dá pra desfazer."
            action={
              <Button
                variant="secondary"
                size="sm"
                className="border-danger/30 text-danger hover:bg-danger/10 active:bg-danger/[0.16]"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash /> Excluir conta
              </Button>
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection
        id="bankroll-title"
        title="Banca e sinais"
        description="Base de cálculo da unidade e dos alertas. O bot do Telegram e a lista de casas usam estes valores."
      >
        <BankrollSignalsCard form={prefsForm} />
      </SettingsSection>

      <SettingsSection
        id="integrations-title"
        title="Integrações"
        description="Registre apostas por mensagem e veja o que falta com /pendentes."
      >
        <TelegramCard me={me} />
      </SettingsSection>

      <SettingsSection
        id="export-title"
        title="Dados"
        // No Grátis o Baixar CSV abre o aviso do Pro; o selo avisa antes do clique.
        badge={
          !can("csvExport") && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent-text">
              <Sparkle size={11} weight="fill" /> Pro
            </span>
          )
        }
        description='Arquivos CSV com separador ";", que abrem direto no Excel.'
      >
        <ExportDataCard totalBets={summary.totalBets} />
      </SettingsSection>

      {/* Some quando não há o que salvar: depois de salvar, o `me` novo
          reidrata os formulários e o "sujo" volta a falso. */}
      {dirty && (
        <div
          role="region"
          aria-label="Alterações não salvas"
          className="sticky bottom-4 z-20 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg animate-rise"
        >
          <span className="flex-1 text-sm text-zinc-300">Alterações não salvas</span>
          <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={saving}>Descartar</Button>
          <Button size="sm" onClick={handleSave} disabled={!canSave} loading={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Button>
        </div>
      )}

      <p className="text-right text-xs text-zinc-600 tabular-nums">Trackton v{__APP_VERSION__}</p>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}
