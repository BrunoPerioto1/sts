import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CasasApostaView } from "@/components/house/HouseView";
import { CasasMobileView } from "@/components/house/mobile/CasasMobileView";
import { useIsMobile } from "@/hooks/use-mobile";

export function CasasPage() {
  const isMobile = useIsMobile();
  const [count, setCount] = useState(0);

  return (
    <MainLayout
      title="Casas de Apostas"
      mobileHeader={
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-lg font-semibold">Casas</h1>
          <span className="text-sm text-zinc-500">{count}</span>
        </div>
      }
    >
      {isMobile ? <CasasMobileView onCountChange={setCount} /> : <CasasApostaView />}
    </MainLayout>
  );
}
