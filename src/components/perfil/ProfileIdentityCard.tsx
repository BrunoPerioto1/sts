import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { patchMe } from "@/api/routes/patch-me";
import type { MeResponse } from "@/api/routes/get-me";
import { initialsOf } from "@/lib/format";

// Avatar + nome/e-mail editáveis. Card do desktop; no mobile isso vive na
// tela /profile/account.
export function ProfileIdentityCard({ me, onSaved }: { me: MeResponse; onSaved: (me: MeResponse) => void }) {
  const [form, setForm] = useState({ username: me.username, email: me.email });
  const [saving, setSaving] = useState(false);

  // Hidrata quando o usuario chega — do cache (instantaneo) ou da rede.
  useEffect(() => {
    setForm({ username: me.username, email: me.email });
  }, [me]);

  const handleSave = async () => {
    setSaving(true);
    try {
      onSaved(await patchMe(form));
      actionToast.success({ title: "Perfil atualizado" });
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao salvar.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card elev-sm bg-card rounded-md p-[16px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-accent-800 text-accent-100 flex items-center justify-center text-lg font-medium shrink-0">
          {initialsOf(me.username)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-medium truncate">{me.username}</p>
          <p className="text-sm opacity-55 truncate">
            {me.email}
            {me.createdAt ? ` · na plataforma desde ${new Date(me.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-zinc-500">Nome</Label>
          <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-zinc-500">E-mail</Label>
          <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => setForm({ username: me.username, email: me.email })}>Descartar</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Button>
      </div>
    </div>
  );
}
