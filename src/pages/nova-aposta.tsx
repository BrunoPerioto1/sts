import { useEffect, useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ApostasList } from "@/components/apostas/ApostasList";
import { ApostaFormModal } from "@/components/apostas/ApostaFormModal";
import { EditApostaModal } from "@/components/apostas/EditApostaModal";
import { ApostasFilter } from "@/components/apostas/ApostasFilter";
import { 
  getBets as fetchBets, 
  type BetItem, 
  ResultIdEnum, 
  deleteMultipleBets, 
  deleteBet, 
  finalizeMultipleBets, 
  type PaginatedBetsResponseDto 
} from "@/api/routes/get-bets";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

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
  const [loading, setLoading] = useState(false); // só para tabela/botões
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const { toast } = useToast();

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const scrollToTop = () => {
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchFilteredBets = async () => {
    setLoading(true);
    try {
      const params: any = { page, perPage };
      if (statusFilter) params.resultId = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchTerm) params.q = searchTerm;

      const response: PaginatedBetsResponseDto = await fetchBets(params);
      const serverData = Array.isArray(response?.data) ? response.data : [];

      setApostas(serverData);
      setTotalPages(response?.totalPages || 1);
      setTotal(response?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  // Debounce na pesquisa
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchFilteredBets();
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm, statusFilter, startDate, endDate, page, perPage]);

  useEffect(() => {
    scrollToTop();
  }, [page]);

  const handleApostaAdded = (aposta: BetItem) => {
    setCreateModalOpen(false);
    setPage(1); // Volta para página 1 onde a nova aposta estará
    fetchFilteredBets(); // Recarrega dados do servidor
  };

  const handleApostaUpdated = (aposta: BetItem) => {
    setEditModalOpen(false);
    setEditAposta(null);
    fetchFilteredBets(); // Recarrega dados para respeitar filtros
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
      setSelectedBets([]);
      await fetchFilteredBets(); // Recarrega dados do servidor
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
        <ApostasFilter
          onSearch={(term) => { setSearchTerm(term); setPage(1); }}
          onFilterStatus={(status) => { setStatusFilter(status === "0" ? "" : status); setPage(1); }}
          onDateFromChange={(date) => { setStartDate(date); setPage(1); }}
          onDateToChange={(date) => { setEndDate(date); setPage(1); }}
          onClearFilters={() => {
            setStartDate("");
            setEndDate("");
            setStatusFilter("");
            setSearchTerm("");
            setPage(1);
          }}
          isLoading={false} // filtros nunca bloqueiam
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl font-bold">Apostas Registradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-3 md:px-6 pb-4">
            {/* Botões de Ação e Checkbox "Selecionar todas" */}
            <div className="space-y-3">
              {/* Primeira linha: Ações principais */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => { setPage(1); fetchFilteredBets(); }} 
                    disabled={loading}
                    size="sm"
                    className="flex-1 sm:flex-initial"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    <span className="hidden sm:inline">Atualizar</span>
                    <span className="sm:hidden">Atualizar</span>
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => setCreateModalOpen(true)} 
                    disabled={loading}
                    size="sm"
                    className="flex-1 sm:flex-initial"
                  >
                    Nova Aposta
                  </Button>
                  <Select
                    value={String(perPage)}
                    onValueChange={(v) => { setPage(1); setPerPage(Number(v)); }}
                  >
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Itens/página" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 por página</SelectItem>
                      <SelectItem value="20">20 por página</SelectItem>
                      <SelectItem value="30">30 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Segunda linha: Seleção e ações em lote */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedBets.length === apostas.length && apostas.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={loading}
                  />
                  <label htmlFor="select-all" className="text-sm">Selecionar todas</label>
                </div>

                {selectedBets.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteSelected} 
                      className="flex items-center gap-2 flex-1 sm:flex-initial" 
                      disabled={loading}
                      size="sm"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      <span className="hidden sm:inline">Excluir Selecionadas</span>
                      <span className="sm:hidden">Excluir</span>
                    </Button>
                    <Select
                      onValueChange={value => handleBulkStatusChange(Number(value))}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Alterar Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(ResultIdEnum.PENDING)}>Pendente</SelectItem>
                        <SelectItem value={String(ResultIdEnum.WON)}>Ganha</SelectItem>
                        <SelectItem value={String(ResultIdEnum.LOST)}>Perdida</SelectItem>
                        <SelectItem value={String(ResultIdEnum.CANCELED)}>Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            {/* A tabela da lista de apostas */}
            <ApostasList
              apostas={apostas}
              isLoading={loading}
              onEdit={handleEdit}
              onDelete={async (id) => {
                setLoading(true);
                try {
                  await deleteBet(id);
                  setSelectedBets(prev => prev.filter(betId => betId !== id)); // Limpa seleções
                  await fetchFilteredBets(); // Recarrega dados do servidor
                  toast({ title: "Sucesso", description: "Aposta excluída!" });
                } catch (e: any) {
                  toast({ title: "Erro", description: e.message || "Falha ao excluir aposta", variant: "destructive" });
                } finally {
                  setLoading(false);
                }
              }}
              selectedBets={selectedBets}
              onSelectBet={handleSelectBet}
              showCheckboxes
            />

            {/* Paginação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
              <p className="text-sm text-muted-foreground text-center sm:text-left">{`Total: ${total}`}</p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (page > 1) {
                          setPage(page - 1); 
                        }
                      }}
                    />
                  </PaginationItem>
                  {/* Simple numbered pagination (up to 5 pages around current) */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map(p => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === page}
                          onClick={(e) => { 
                            e.preventDefault(); 
                            if (p !== page) {
                              setPage(p); 
                            }
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (page < totalPages) {
                          setPage(page + 1); 
                        }
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>

        {/* Modais de formulário e edição */}
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