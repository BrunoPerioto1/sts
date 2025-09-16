import { MainLayout } from "@/components/layout/MainLayout";
import { CasasApostaView } from "@/components/casas-aposta/CasasApostaView";

export function CasasPage() {
  return (
    <MainLayout title="Casas de Apostas">
      <CasasApostaView />
    </MainLayout>
  );
}
