import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/queries/use-me";
import { usePreferencesForm } from "@/hooks/use-preferences-form";
import { PreferencesFields } from "@/components/perfil/PreferencesFields";

export default function PreferencesPage() {
  const navigate = useNavigate();
  const { me, setMe } = useMe();
  const form = usePreferencesForm(me, setMe);

  // Hidrata o form quando o usuario chega — do cache (instantaneo) ou da rede.
  useEffect(() => {
    if (me) form.resetFrom(me);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  return (
    <MainLayout
      title="Preferências de aposta"
      hideHeaderBorder
      hideBottomNav
      mobileHeader={
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={() => navigate(-1)} aria-label="Voltar" className="p-1 -ml-1 text-zinc-400 hover:text-white">
            <CaretLeft size={20} />
          </button>
          <h1 className="text-base font-semibold truncate">Preferências de aposta</h1>
        </div>
      }
    >
      {!me ? (
        <div className="opacity-55 text-sm">Carregando…</div>
      ) : (
        <div className="flex flex-col min-h-[calc(100dvh-200px)]">
          <div className="space-y-6">
            <PreferencesFields form={form} />
          </div>

          <div className="flex-1" />

          <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-background border-t border-border flex gap-2" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
            <Button variant="outline" className="flex-1" onClick={form.handleDiscard}>Descartar</Button>
            <Button className="flex-1" onClick={form.handleSave} disabled={!form.canSave}>{form.saving ? "Salvando…" : "Salvar alterações"}</Button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
