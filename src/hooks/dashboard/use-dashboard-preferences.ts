import { useRef, useState } from "react";
import { useMe } from "@/hooks/queries/use-me";
import { patchMe } from "@/api/routes/patch-me";
import { normalizeDashboardPreferences, type DashboardPreferences } from "@/lib/dashboard-preferences";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";

export function useDashboardPreferences() {
  const { me, setMe, reloadMe } = useMe();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const preferences = normalizeDashboardPreferences(me?.dashboardPreferences);

  async function save(next: DashboardPreferences | null) {
    if (!me || locked.current) return;
    locked.current = true;
    setSaving(true);
    setError(null);
    const previous = me;
    setMe({ ...me, dashboardPreferences: next });
    try {
      setMe(await patchMe({ dashboardPreferences: next }));
    } catch (cause) {
      setMe(previous);
      const description = getErrorMessage(cause, "Não foi possível salvar a personalização. Tente novamente.");
      setError(description);
      actionToast.error({ description });
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }

  return { me, preferences, save, saving, error, reloadMe };
}
