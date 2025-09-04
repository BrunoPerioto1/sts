import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MovimentacaoModal } from "./MovimentacaoModal";
import { Building2, DollarSign, TrendingUp, Plus, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { type BetItem } from "@/api/routes/get-bets";
import { getHouseBalances, type HouseBalanceDto } from "@/api/routes/get-houses";

interface CasasApostaViewProps {
  apostas: BetItem[];
}

type CasaSaldo = { 
  id: number; 
  nome: string; 
  saldo: number;
  totalApostas: number;
  apostasGanhas: number;
  apostasPerdidas: number;
  apostasPendentes: number;
};

export function CasasApostaView({ apostas }: CasasApostaViewProps) {
  const [selectedCasa, setSelectedCasa] = useState<{nome: string, saldo: number} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [casas, setCasas] = useState<CasaSaldo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBalances = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const balances = await getHouseBalances();
        const casasFiltradas: CasaSaldo[] = (balances || []).map((b: HouseBalanceDto) => ({
          id: b.houseId,
          nome: b.houseName,
          saldo: Number(b.realHouseBalance ?? b.houseBalance ?? 0),
          totalApostas: Number(b.totalBets ?? 0),
          apostasGanhas: Number(b.wonBets ?? 0),
          apostasPerdidas: Number(b.lostBets ?? 0),
          apostasPendentes: Number(b.pendingBets ?? 0),
        }));
        setCasas(casasFiltradas);
      } catch (e: any) {
        setError(e.message || "Falha ao carregar saldos");
      } finally {
        setIsLoading(false);
      }
    };
    loadBalances();
  }, []);

  const getApostasPorCasa = (houseId: number) => {
    return apostas.filter(aposta => aposta.houseId === houseId);
  };

  const getStatusColor = (resultId?: number | null) => {
    switch (resultId) {
      case 1: // ganha
        return 'bg-success text-success-foreground';
      case 2: // perdida
        return 'bg-destructive text-destructive-foreground';
      case 9: // pendente
        return 'bg-secondary text-secondary-foreground';
      case 3: // cancelada (ajustado para enum do routes)
      case 10: // backward compat
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleVerMovimentacao = (casa: { nome: string, saldo: number }) => {
    setSelectedCasa(casa);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casas com Apostas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{casas.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {apostas.reduce((acc, a) => acc + a.stake, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro/Prejuízo</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {casas.reduce((acc, c) => acc + c.saldo, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de casas de aposta */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando...</div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : casas.map((casa, index) => {
          const apostasCasa = getApostasPorCasa(casa.id);
          return (
            <Card key={`${casa.nome}-${index}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{casa.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {apostasCasa.length} apostas registradas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        R$ {casa.saldo.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">Lucro/Prejuízo</p>
                      <div className="text-xs text-muted-foreground">
                        {casa.apostasGanhas}G / {casa.apostasPerdidas}P / {casa.apostasPendentes}Pen
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerMovimentacao({ nome: casa.nome, saldo: casa.saldo })}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Histórico
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {apostasCasa.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Últimas Apostas
                    </h4>
                    {apostasCasa.slice(0, 3).map((aposta) => (
                      <div
                        key={aposta.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{aposta.game}</p>
                          <p className="text-sm text-muted-foreground">
                            {aposta.betTime ? new Date(aposta.betTime).toLocaleDateString() : 'N/A'} às {aposta.betTime ? new Date(aposta.betTime).toLocaleTimeString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">R$ {aposta.stake.toFixed(2)}</span>
                            <Badge className={getStatusColor(aposta.resultId)}>
                              {aposta.resultId === 1 ? 'Ganha' : aposta.resultId === 2 ? 'Perdida' : aposta.resultId === 9 ? 'Pendente' : aposta.resultId === 3 ? 'Cancelada' : 'N/A'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Odd: {aposta.odd.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {apostasCasa.length > 3 && (
                      <Button variant="outline" size="sm" className="w-full">
                        Ver todas as {apostasCasa.length} apostas
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      Nenhuma aposta registrada nesta casa
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedCasa && (
        <MovimentacaoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          casaNome={selectedCasa.nome}
          saldoAtual={selectedCasa.saldo}
          houseId={(casas.find(c => c.nome === selectedCasa.nome)?.id) || 0}
        />
      )}
    </div>
  );
}