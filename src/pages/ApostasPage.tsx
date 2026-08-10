import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  finalizeBet,
  finalizeMultipleBets,
  createBet,
  type PaginatedBetsResponseDto,
} from "@/api/routes/get-bets";
import { getAllHouses } from "@/api/routes/get-houses";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CaretLeft, CaretRight, Plus, Trash } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";

export default function ApostasPage() {
  const [searchParams] = useSearchParams();
  const [apostas, setApostas] = useState<BetItem[]>([]);
  const [houses, setHouses] = useState<{ id: number; name: string }[]>([]);
  const [editAposta, setEditAposta] = useState<BetItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedBets, setSelectedBets] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [houseFilter, setHouseFilter] = useState<number | undefined>(() => {
    const fromUrl = searchParams.get("houseId");
    return fromUrl ? Number(fromUrl) : undefined;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(30);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getAllHouses().then((data) => setHouses(data.map((h) => ({ id: h.id, name: h.name })))).catch(() => undefined);
  }, []);

  const fetchFilteredBets = async () => {
    setLoading(true);
    try {
      const params: any = { page, perPage };
      if (statusFilter) params.resultId = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchTerm) params.q = searchTerm;
      const response: PaginatedBetsResponseDto = await fetchBets(params);
      let data = Array.isArray(response?.data) ? response.data : [];
      if (houseFilter) data = data.filter((b) => b.houseId === houseFilter);
      setApostas(data);
      setTotalPages(response?.totalPages || 1);
      setTotal(response?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(fetchFilteredBets, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, houseFilter, startDate, endDate, page, perPage]);

  const reload = () => fetchFilteredBets();

  const handleDeleteSelected = async () => {
    if (selectedBets.length === 0) return;
    setLoading(true);
    try {
      await deleteMultipleBets(selectedBets);
      setSelectedBets([]);
      await reload();
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
      await reload();
      setSelectedBets([]);
      toast({ title: "Status atualizado", description: "Apostas alteradas!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao atualizar status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (id: number, resultId: ResultIdEnum) => {
    try {
      await finalizeBet(id, { resultId });
      await reload();
      toast({ title: "Aposta liquidada" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao liquidar aposta", variant: "destructive" });
    }
  };

  const handleDuplicate = async (aposta: BetItem) => {
    try {
      await createBet({
        game: aposta.game,
        stake: Number(aposta.stake),
        odd: Number(aposta.odd),
        houseId: aposta.houseId,
        market: aposta.market,
        sport: aposta.sport,
        betTime: new Date().toISOString(),
      });
      await reload();
      toast({ title: "Aposta duplicada" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao duplicar aposta", variant: "destructive" });
    }
  };

  const handleExportCsv = () => {
    const header = ["Data", "Evento", "Mercado", "Casa", "Odd", "Stake", "Status", "Retorno"];
    const rows = apostas.map((b) => [
      new Date(b.betTime).toLocaleDateString("pt-BR"),
      b.game,
      b.market,
      b.houseName ?? "",
      Number(b.odd).toFixed(2),
      Number(b.stake).toFixed(2),
      b.resultName ?? "",
      b.profit != null ? Number(b.profit).toFixed(2) : "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apostas.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageWindow = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );

  return (
    <MainLayout
      title="Apostas"
      actions={
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus size={16} /> Nova aposta
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-xs opacity-45 -mt-2">{total} registros</p>

        <ApostasFilter
          houses={houses}
          onSearch={(term) => { setSearchTerm(term); setPage(1); }}
          onFilterStatus={(status) => { setStatusFilter(status === "0" ? "" : status); setPage(1); }}
          onFilterHouse={(id) => { setHouseFilter(id === "0" ? undefined : Number(id)); setPage(1); }}
          onDateFromChange={(date) => { setStartDate(date); setPage(1); }}
          onDateToChange={(date) => { setEndDate(date); setPage(1); }}
          onClearFilters={() => { setStartDate(""); setEndDate(""); setStatusFilter(""); setHouseFilter(undefined); setSearchTerm(""); setPage(1); }}
          onExportCsv={handleExportCsv}
          isLoading={loading}
        />

        <div className="card elev-sm bg-card rounded-md p-[14px_16px] space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedBets.length === apostas.length && apostas.length > 0}
                onCheckedChange={() => setSelectedBets(selectedBets.length === apostas.length ? [] : apostas.map((a) => a.id))}
                disabled={loading}
              />
              <label className="text-sm opacity-70">Selecionar todas</label>
            </div>

            {selectedBets.length > 0 && (
              <div className="flex flex-wrap gap-2 ml-auto">
                <Select onValueChange={(v) => handleBulkStatusChange(Number(v))} disabled={loading}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Alterar status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(ResultIdEnum.PENDING)}>Pendente</SelectItem>
                    <SelectItem value={String(ResultIdEnum.WON)}>Ganha</SelectItem>
                    <SelectItem value={String(ResultIdEnum.LOST)}>Perdida</SelectItem>
                    <SelectItem value={String(ResultIdEnum.CANCELED)}>Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={loading} className="gap-2">
                  <Trash size={14} /> Excluir selecionadas
                </Button>
              </div>
            )}
          </div>

          <ApostasList
            apostas={apostas}
            isLoading={loading}
            onEdit={(a) => { setEditAposta(a); setEditModalOpen(true); }}
            onDuplicate={handleDuplicate}
            onFinalize={handleFinalize}
            onDelete={async (id) => {
              setLoading(true);
              try {
                await deleteBet(id);
                setSelectedBets((prev) => prev.filter((betId) => betId !== id));
                await reload();
                toast({ title: "Sucesso", description: "Aposta excluída!" });
              } catch (e: any) {
                toast({ title: "Erro", description: e.message || "Falha ao excluir aposta", variant: "destructive" });
              } finally {
                setLoading(false);
              }
            }}
            selectedBets={selectedBets}
            onSelectBet={(id) => setSelectedBets((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]))}
            showCheckboxes
          />

          <div className="flex items-center justify-between pt-2">
            <p className="text-[12.5px] opacity-45">
              {apostas.length > 0 ? `${(page - 1) * perPage + 1}–${(page - 1) * perPage + apostas.length}` : "0"} de {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => page > 1 && setPage(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-foreground/[0.07] disabled:opacity-35"
              >
                <CaretLeft size={14} />
              </button>
              {pageWindow.map((p, i) => (
                <span key={p} className="flex items-center">
                  {i > 0 && pageWindow[i - 1] !== p - 1 && <span className="px-1 opacity-35 text-xs">…</span>}
                  <button
                    onClick={() => setPage(p)}
                    className="w-8 h-8 rounded-md text-[13px]"
                    style={
                      p === page
                        ? { boxShadow: "inset 0 0 0 1px var(--color-accent)", color: "var(--color-accent)" }
                        : { opacity: 0.62 }
                    }
                  >
                    {p}
                  </button>
                </span>
              ))}
              <button
                onClick={() => page < totalPages && setPage(page + 1)}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-foreground/[0.07] disabled:opacity-35"
              >
                <CaretRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <ApostaFormModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onApostaAdded={() => { setCreateModalOpen(false); setPage(1); reload(); }} />
        {editAposta && (
          <EditApostaModal
            aposta={editAposta}
            isOpen={editModalOpen}
            onClose={() => { setEditModalOpen(false); setEditAposta(null); }}
            onApostaUpdated={() => { setEditModalOpen(false); setEditAposta(null); reload(); }}
          />
        )}
      </div>
    </MainLayout>
  );
}
