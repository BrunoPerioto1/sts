import { MainLayout } from "@/components/layout/MainLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMe } from "@/hooks/queries/use-me";
import { useProfileSummary } from "@/hooks/perfil/use-profile-summary";
import { PerfilSkeleton } from "@/components/perfil/PerfilSkeleton";
import { PerfilMobileView } from "@/components/perfil/PerfilMobileView";
import { PerfilDesktopView } from "@/components/perfil/PerfilDesktopView";

export default function PerfilPage() {
  const isMobile = useIsMobile();
  const { me } = useMe();
  const metrics = useProfileSummary();

  if (!me) {
    return (
      <MainLayout title="Perfil" hideHeaderBorder={isMobile} mobileHeader={isMobile ? <div className="skeleton h-7 w-32 rounded" /> : undefined}>
        <PerfilSkeleton className={isMobile ? "min-h-[calc(100dvh-190px)]" : "max-w-xl"} />
      </MainLayout>
    );
  }

  if (isMobile) {
    if (!metrics.isError && metrics.loading) {
      return (
        <MainLayout title="Perfil" hideHeaderBorder mobileHeader={<div className="skeleton h-7 w-32 rounded" />}>
          <PerfilSkeleton className="min-h-[calc(100dvh-190px)]" />
        </MainLayout>
      );
    }
    return (
      <MainLayout
        title="Perfil"
        hideHeaderBorder
        mobileHeader={<h1 className="text-2xl font-semibold tracking-tight truncate">{me.username}</h1>}
      >
        <PerfilMobileView
          me={me}
          summary={metrics.summary}
          metricsLoading={metrics.loading}
          metricsError={metrics.isError}
          metricsUnavailable={metrics.unavailable}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Perfil">
      <PerfilDesktopView me={me} summary={metrics.summary} />
    </MainLayout>
  );
}
