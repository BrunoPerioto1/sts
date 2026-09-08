import { MainLayout } from "@/components/layout/MainLayout";
import { CasasApostaView } from "@/components/house/HouseView";
import { CasasMobileView } from "@/components/house/mobile/CasasMobileView";
import { useHouseBalances } from "@/hooks/queries/use-houses";
import { useIsMobile } from "@/hooks/use-mobile";

export function CasasPage() {
  const isMobile = useIsMobile();
  // Mesma query das views (cacheada) — evita o vaivém de estado só pra contar
  // linhas no cabeçalho.
  const houses = useHouseBalances().data ?? [];
  const withBalance = houses.filter((h) => Number(h.realHouseBalance) > 0).length;

  return (
    <MainLayout
      title="Casas de apostas"
      subtitle={`${houses.length} casas · ${withBalance} com saldo`}
      titleWrapperClassName="flex items-baseline gap-2.5 min-w-0"
      titleClassName="text-2xl font-semibold tracking-tight shrink-0"
      subtitleClassName="text-sm text-zinc-500 truncate"
      mobileHeader={
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight">Casas</h1>
          <span className="text-sm text-zinc-500">{houses.length}</span>
        </div>
      }
    >
      {isMobile ? <CasasMobileView /> : <CasasApostaView />}
    </MainLayout>
  );
}
