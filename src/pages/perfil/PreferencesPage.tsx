import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FormSkeleton } from "@/components/ui/skeleton";
import { ScreenFooter } from "@/components/perfil/ScreenFooter";
import { useMe } from "@/hooks/queries/use-me";
import { usePreferencesForm } from "@/hooks/use-preferences-form";
import { PreferencesFields } from "@/components/perfil/PreferencesFields";
import { PageHeader } from "@/components/ui/page-header";

export default function PreferencesPage() {
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
      mobileHeader={<PageHeader back title="Preferências de aposta" />}
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
