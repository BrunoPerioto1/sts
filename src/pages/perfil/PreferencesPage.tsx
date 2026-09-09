import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FormSkeleton } from "@/components/ui/skeleton";
import { ScreenFooter } from "@/components/perfil/ScreenFooter";
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
          <h1 className="text-lg font-semibold truncate">Preferências de aposta</h1>
        </div>
      }
    >
      {!me ? (
        <FormSkeleton fields={4} />
      ) : (
        <div className="flex flex-col">
          <div className="flex flex-col gap-7">
            <PreferencesFields form={form} />
          </div>

          <ScreenFooter onSave={form.handleSave} onDiscard={form.handleDiscard} saving={form.saving} disabled={!form.canSave} />
        </div>
      )}
    </MainLayout>
  );
}
