import { MainLayout } from "@/components/layout/MainLayout";
import { CasasApostaView } from "@/components/house/HouseView";

export function CasasPage() {
  return (
    <MainLayout title="Casas de Apostas">
      <CasasApostaView />
    </MainLayout>
  );
}
