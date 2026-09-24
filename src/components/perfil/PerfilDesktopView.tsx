import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { patchMe, type UpdateMeParams } from "@/api/routes/patch-me";
import { usePreferencesForm } from "@/hooks/use-preferences-form";
import { useMe } from "@/hooks/queries/use-me";
import type { MeResponse } from "@/api/routes/get-me";
import type { ProfileSummary } from "@/hooks/perfil/use-profile-summary";
import { ThemeSelect } from "./ThemeSelect";
import { BankrollSignalsCard } from "./BankrollSignalsCard";
import { ExportDataCard } from "./ExportDataCard";
import { TelegramCard } from "./TelegramCard";

const labelClass = "text-[13px] font-normal text-zinc-400";

export function PerfilDesktopView({ me, summary }: { me: MeResponse; summary: ProfileSummary }) {
  const navigate = useNavigate();
  const { setMe, reloadMe } = useMe();
  const prefsForm = usePreferencesForm(me, setMe);
  const [account, setAccount] = useState({ username: me.username, email: me.email, currentPassword: "" });
  const [saving, setSaving] = useState(false);

  // Hidrata os dois formulários quando o usuario chega — do cache
  // (instantaneo), da rede ou da resposta do salvar.
  useEffect(() => {
    prefsForm.resetFrom(me);
    setAccount({ username: me.username, email: me.email, currentPassword: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const emailChanged = account.email !== me.email;
  const accountDirty = account.username !== me.username || emailChanged;
  const dirty = accountDirty || prefsForm.dirty;
  // E-mail é o login: o servidor só troca com a senha atual.
  const canSave =
    !saving && prefsForm.valid && account.username.trim() !== "" && (!emailChanged || account.currentPassword !== "");

  const handleSave = async () => {
    if (!canSave) return;
    const payload: UpdateMeParams = {};
    if (accountDirty) {
      payload.username = account.username;
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
    setAccount({ username: me.username, email: me.email, currentPassword: "" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)] gap-10 items-start pb-4">
      <div className="flex flex-col gap-8 min-w-0">
        <section aria-labelledby="account-title">
          <h2 id="account-title" className="text-base font-semibold mb-3">Conta</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="account-name" className={labelClass}>Nome</Label>
              <Input id="account-name" className="h-10 rounded-lg" value={account.username} onChange={(e) => setAccount((p) => ({ ...p, username: e.target.value }))} />
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
          {me.createdAt && (
            <p className="text-xs text-zinc-500 mt-3">
              Conta criada em {new Date(me.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          )}
        </section>

        <BankrollSignalsCard form={prefsForm} />

        <section className="flex items-center justify-between gap-4" aria-labelledby="theme-title">
          <div>
            <h2 id="theme-title" className="text-base font-semibold">Tema</h2>
            <p className="text-[13px] text-zinc-400 mt-1">Vale só para este aparelho.</p>
          </div>
          <ThemeSelect />
        </section>

        <ExportDataCard totalBets={summary.totalBets} />

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
            <Button size="sm" onClick={handleSave} disabled={!canSave}>{saving ? "Salvando…" : "Salvar alterações"}</Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <TelegramCard me={me} onUnlinked={reloadMe} />
        <button
          type="button"
          onClick={() => navigate("/logout")}
          className="press self-start flex items-center gap-2 px-2 py-1.5 text-[13px] text-zinc-400 hover:text-foreground"
        >
          <SignOut size={15} /> Sair da conta
        </button>
      </div>
    </div>
  );
}
