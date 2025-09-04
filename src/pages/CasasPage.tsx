import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CasasApostaView } from "@/components/casas-aposta/CasasApostaView";
import { getBets, type BetItem } from "@/api/routes/get-bets";

function CasasPageContent() {
  const [bets, setBets] = useState<BetItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const rows = await getBets();
      setBets(rows || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Casas de Apostas</h2>
          <p className="text-muted-foreground">Acompanhe saldos, apostas e transações por casa</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2" onClick={refresh} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <CasasApostaView apostas={bets} />
    </div>
  );
}

export function CasasPage() {
  return (
    <MainLayout title="Casas de Apostas">
      <CasasPageContent />
    </MainLayout>
  );
}
