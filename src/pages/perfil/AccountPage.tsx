import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionToast } from "@/lib/action-toast";
import { getMe, type MeResponse } from "@/api/routes/get-me";
import { patchMe } from "@/api/routes/patch-me";
import { getErrorMessage } from "@/lib/api-error";

export default function AccountPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [form, setForm] = useState({ username: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMe().then((data) => {
      setMe(data);
      setForm({ username: data.username, email: data.email });
    }).catch(() => undefined);
  }, []);

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
          <h1 className="text-[17px] font-semibold truncate">Dados da conta</h1>
        </div>
      }
    >
      {!me ? (
        <div className="opacity-55 text-sm">Carregando…</div>
      ) : (
        <div className="flex flex-col min-h-[calc(100dvh-200px)]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500">Nome</Label>
              <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500">E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>

          <div className="flex-1" />

          <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-background border-t border-border flex gap-2" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
            <Button variant="outline" className="flex-1" onClick={handleDiscard}>Descartar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
