import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { replaceToken } from "@/lib/auth-session";
import { cn } from "@/lib/utils";
import { postChangePassword } from "@/api/routes/post-change-password";
import { MIN_PASSWORD } from "@/hooks/auth/use-register-form";

const EMPTY = { current: "", next: "", confirm: "" };

function PasswordField({ id, label, autoComplete, value, onChange, error }: {
  id: string; label: string; autoComplete: string; value: string; onChange: (value: string) => void; error?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-normal text-zinc-400">{label}</Label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        className={cn("h-10 rounded-lg", error && "border-danger")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// Versão em diálogo (desktop) da PasswordPage do celular, com a confirmação
// da senha nova que a tela do celular não tem.
export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState(EMPTY);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tooShort = form.next.length > 0 && form.next.length < MIN_PASSWORD;
  const mismatch = form.confirm.length > 0 && form.confirm !== form.next;
  const canSave = !saving && form.current.length > 0 && form.next.length >= MIN_PASSWORD && form.confirm === form.next;

  const change = (next: boolean) => {
    if (saving) return;
    if (!next) {
      setForm(EMPTY);
      setServerError(null);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setServerError(null);
    try {
      const { access_token } = await postChangePassword({ currentPassword: form.current, newPassword: form.next });
      // A senha nova derrubou todas as sessões; esta segue com o token novo.
      replaceToken(access_token);
      actionToast.success({ title: "Senha alterada", description: "Os outros aparelhos foram desconectados." });
      setForm(EMPTY);
      onOpenChange(false);
    } catch (err) {
      setServerError(getErrorMessage(err, "Falha ao alterar a senha."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <p className="text-sm text-zinc-400">Você continua conectado neste aparelho.</p>
          </DialogHeader>

          <PasswordField
            id="change-current"
            label="Senha atual"
            autoComplete="current-password"
            value={form.current}
            onChange={(current) => {
              setServerError(null);
              setForm((p) => ({ ...p, current }));
            }}
            error={serverError}
          />
          <PasswordField
            id="change-next"
            label="Nova senha"
            autoComplete="new-password"
            value={form.next}
            onChange={(next) => setForm((p) => ({ ...p, next }))}
            error={tooShort ? `Use ${MIN_PASSWORD} caracteres ou mais.` : null}
          />
          <PasswordField
            id="change-confirm"
            label="Confirmar nova senha"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(confirm) => setForm((p) => ({ ...p, confirm }))}
            error={mismatch ? "As senhas não são iguais." : null}
          />

          <DialogFooter className="gap-2 sm:gap-0 pt-1">
            <Button type="button" variant="secondary" onClick={() => change(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={!canSave} loading={saving}>{saving ? "Alterando…" : "Alterar senha"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
