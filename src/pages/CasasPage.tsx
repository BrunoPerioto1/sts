import { houseMoney } from "@/lib/house-groups";
import { MainLayout } from "@/components/layout/MainLayout";
import { CasasApostaView } from "@/components/house/HouseView";
import { CasasMobileView } from "@/components/house/mobile/CasasMobileView";
import { useHouseBalances } from "@/hooks/queries/use-houses";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/ui/page-header";
import { formatInt } from "@/lib/format";

export function CasasPage() {
  const isMobile = useIsMobile();
  // Mesma query das views (cacheada) — evita o vaivém de estado só pra contar
  // linhas no cabeçalho.
  const houses = useHouseBalances().data ?? [];
  const withBalance = houses.filter((h) => houseMoney(h).available > 0).length;
  const subtitle = `${formatInt(houses.length)} casas · ${formatInt(withBalance)} com saldo`;

  // O desktop monta o próprio cabeçalho: CSV e Saque em lote ficam nele e
  // dependem do filtro da tela.
  if (!isMobile) return <CasasApostaView />;

  return (
    <MainLayout
      title="Casas de apostas"
      subtitle={subtitle}
      mobileHeader={<PageHeader title="Casas" subtitle={subtitle} />}
    >
      <CasasMobileView />
    </MainLayout>
  );
}
