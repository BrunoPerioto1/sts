import { useState, useEffect } from "react";
import { HouseDetailsModal } from "./HouseDetailsModal";
import { HouseListItem } from "./HouseListItem";
import { HousesMetrics } from "./HouseMetrics";
import { HousesSearch } from "./HouseSearch";
import { Building2 } from "lucide-react";
import { 
  HouseBalanceDto, 
  HouseMetricsDto,
  getHouseBalances,
  getHouseMetrics
} from "@/api/routes/get-houses";
import { useToast } from "@/hooks/use-toast";
import { NovaTransacaoModal } from "./NovaTransacaoModal";
import { MovimentacaoModal } from "./MovimentacaoModal";

export function CasasApostaView() {
  const [houses, setHouses] = useState<HouseBalanceDto[]>([]);
  const [metrics, setMetrics] = useState<HouseMetricsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHouse, setSelectedHouse] = useState<HouseBalanceDto | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [isNovaTransacaoModalOpen, setIsNovaTransacaoModalOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [housesData, metricsData] = await Promise.all([
        getHouseBalances(),
        getHouseMetrics()
      ]);
      
      setHouses(housesData);
      setMetrics(metricsData);
    } catch {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as informações das casas de apostas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredHouses = houses.filter(house =>
    house.houseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const handleViewDetails = (house: HouseBalanceDto) => {
    setSelectedHouse(house);
    setIsDetailsModalOpen(true);
  };

  const handleOpenMovimentacao = (house: HouseBalanceDto) => {
    setSelectedHouse(house);
    setIsMovimentacaoModalOpen(true);
  };

  const handleOpenNovaTransacao = (house: HouseBalanceDto) => {
    setSelectedHouse(house);
    setIsNovaTransacaoModalOpen(true);
  };

  if (loading) {
    return <div>Carregando...</div>; 
  }

  return (
    <div className="space-y-6">
      {metrics && <HousesMetrics metrics={metrics} formatCurrency={formatCurrency} />}

      <HousesSearch searchTerm={searchTerm} onChange={setSearchTerm} />

      <div className="space-y-4">
        {filteredHouses.map((house) => (
          <HouseListItem 
            key={house.houseId} 
            house={house} 
            onViewDetails={() => handleViewDetails(house)}
            onNewTransaction={() => handleOpenNovaTransacao(house)}
            onOpenHistory={() => handleOpenMovimentacao(house)}
          />
        ))}
      </div>

      {filteredHouses.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma casa encontrada
          </h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? "Nenhuma casa de apostas corresponde aos filtros aplicados."
              : "Não há casas de apostas cadastradas no momento."
            }
          </p>
        </div>
      )}

      {/* Modais */}
      {selectedHouse && (
        <>
          <HouseDetailsModal
            house={selectedHouse}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
          />

          <MovimentacaoModal
            isOpen={isMovimentacaoModalOpen}
            onClose={() => setIsMovimentacaoModalOpen(false)}
            casaNome={selectedHouse.houseName}
            houseId={selectedHouse.houseId}
          />

          <NovaTransacaoModal
            isOpen={isNovaTransacaoModalOpen}
            onClose={() => setIsNovaTransacaoModalOpen(false)}
            house={selectedHouse}
          />
        </>
      )}
    </div>
  );
}
