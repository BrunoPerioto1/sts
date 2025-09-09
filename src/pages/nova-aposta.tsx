import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ApostasList } from "@/components/apostas/ApostasList";
import { ApostaFormModal } from "@/components/apostas/ApostaFormModal";
import { EditApostaModal } from "@/components/apostas/EditApostaModal";
import { getBets as fetchBets, type BetItem, ResultIdEnum, deleteMultipleBets, finalizeMultipleBets } from "@/api/routes/get-bets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, CheckSquare, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NovaApostaPage() {
  const [apostas, setApostas] = useState<BetItem[]>([]);
  const [editAposta, setEditAposta] = useState<BetItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedBets, setSelectedBets] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchFilteredBets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.resultId = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await fetchBets(params);
      setApostas(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredBets();
  }, [statusFilter, startDate, endDate]);

  const handleApostaAdded = (aposta: BetItem) => {
    setApostas(prev => [aposta, ...prev]);
    setCreateModalOpen(false);
  };

  const handleApostaUpdated = (aposta: BetItem) => {
    setApostas(prev => prev.map(a => a.id === aposta.id ? aposta : a));
    setEditModalOpen(false);
    setEditAposta(null);
  };

  const handleEdit = (aposta: BetItem) => {
    setEditAposta(aposta);
    setEditModalOpen(true);
  };

  const handleSelectBet = (betId: number) => {
    setSelectedBets(prev => prev.includes(betId) ? prev.filter(id => id !== betId) : [...prev, betId]);
  };

  const handleSelectAll = () => {
    setSelectedBets(selectedBets.length === apostas.length ? [] : apostas.map(a => a.id));
  };

  const handleDeleteSelected = async () => {
    if (selectedBets.length === 0) return;
    setLoading(true);
    try {
      await deleteMultipleBets(selectedBets);
      setApostas(prev => prev.filter(a => !selectedBets.includes(a.id)));
      setSelectedBets([]);
      toast({ title: "Sucesso", description: "Apostas excluídas!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao excluir apostas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (resultId: number) => {
    if (selectedBets.length === 0) return;
    setLoading(true);
    try {
      await finalizeMultipleBets({ betIds: selectedBets, resultId });
      await fetchFilteredBets();
      setSelectedBets([]);
      toast({ title: "Status atualizado", description: "Apostas alteradas!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao atualizar status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Gestão de Apostas">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <Button variant="outline" onClick={fetchFilteredBets} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="Data inicial" />
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="Data final" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value={String(ResultIdEnum.PENDING)}>Pendente</SelectItem>
              <SelectItem value={String(ResultIdEnum.WON)}>Ganha</SelectItem>
              <SelectItem value={String(ResultIdEnum.LOST)}>Perdida</SelectItem>
              <SelectItem value={String(ResultIdEnum.CANCELED)}>Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); setStatusFilter(""); }}>
            Limpar Filtros
          </Button>
          <Button variant="default" onClick={() => setCreateModalOpen(true)}>
            Nova Aposta
          </Button>
        </div>

        <div className="flex gap-2 items-center mb-2">
          <Checkbox checked={selectedBets.length === apostas.length && apostas.length > 0} onCheckedChange={handleSelectAll} />
          <span>Selecionar todas</span>
          {selectedBets.length > 0 && (
            <>
              <Button variant="destructive" onClick={handleDeleteSelected} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Excluir Selecionadas
              </Button>
              <Select onValueChange={value => handleBulkStatusChange(Number(value))}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Alterar Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(ResultIdEnum.PENDING)}>Pendente</SelectItem>
                  <SelectItem value={String(ResultIdEnum.WON)}>Ganha</SelectItem>
                  <SelectItem value={String(ResultIdEnum.LOST)}>Perdida</SelectItem>
                  <SelectItem value={String(ResultIdEnum.CANCELED)}>Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <ApostasList apostas={apostas} onEdit={handleEdit} selectedBets={selectedBets} onSelectBet={handleSelectBet} showCheckboxes />
  <ApostaFormModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onApostaAdded={handleApostaAdded} />
        {editAposta && (
          <EditApostaModal
            aposta={editAposta}
            isOpen={editModalOpen}
            onClose={() => { setEditModalOpen(false); setEditAposta(null); }}
            onApostaUpdated={handleApostaUpdated}
          />
        )}
      </div>
    </MainLayout>
  );
}
