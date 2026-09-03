import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, startOfMonth } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { ApostasList } from "@/components/apostas/ApostasList";
import { ApostasGrouped } from "@/components/apostas/ApostasGrouped";
import { ApostaFormModal } from "@/components/apostas/ApostaFormModal";
import { EditApostaModal } from "@/components/apostas/EditApostaModal";
import { ApostasFilter } from "@/components/apostas/ApostasFilter";
import { BulkActionBar } from "@/components/apostas/BulkActionBar";
import { MobileFiltersSheet } from "@/components/apostas/MobileFiltersSheet";
import { MobileSearchToggle, MobileSearchBar } from "@/components/apostas/MobileSearchHeader";
import { useBulkSelection } from "@/hooks/apostas/useBulkSelection";
import { cn } from "@/lib/utils";
import type { ApostasFilterState, PeriodPreset } from "@/types/apostas-filters";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CaretLeft, CaretRight, Plus, Trash, CaretDown, Stack, Table, SlidersHorizontal, CheckSquare, X, ArrowClockwise } from "@phosphor-icons/react";
import { actionToast, Check, CheckCircle, ArrowCounterClockwise, Trash as TrashIcon, Copy } from "@/lib/action-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const statusLabelFor: Record<number, string> = {
  [ResultIdEnum.WON]: "Ganha",
  [ResultIdEnum.LOST]: "Perdida",
  [ResultIdEnum.PENDING]: "Pendente",
};

// Verde/vermelho no toast de finalização em lote são reservados pro resultado
// da aposta (spec Nocturne) — Pendente fica neutro.
const statusWordClassFor: Record<number, string> = {
  [ResultIdEnum.WON]: "text-[#4ADE80]",
  [ResultIdEnum.LOST]: "text-[#F87171]",
};

const mobileStatusPills: { label: string; value: string[] }[] = [
  { label: "Todas", value: [] },
  { label: "Ganhas", value: [String(ResultIdEnum.WON)] },
  { label: "Pendentes", value: [String(ResultIdEnum.PENDING)] },
  { label: "Perdidas", value: [String(ResultIdEnum.LOST)] },
];

export default function ApostasPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apostas, setApostas] = useState<BetItem[]>([]);
  const [houses, setHouses] = useState<{ id: number; name: string }[]>([]);
  const [editAposta, setEditAposta] = useState<BetItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedBets, setSelectedBets] = useState<number[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [houseIds, setHouseIds] = useState<number[]>(() => {
    const fromUrl = searchParams.get("houseId");
    return fromUrl ? [Number(fromUrl)] : [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"agrupado" | "tabela">("agrupado");
  const [startDate, setStartDate] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("mes");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(30);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const selection = useBulkSelection();

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getAllHouses().then((data) => setHouses(data.map((h) => ({ id: h.id, name: h.name })))).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selection.selectionMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") selection.clear();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.selectionMode, selection.clear]);

  const fetchFilteredBets = async (pageArg: number, append: boolean) => {
    selection.clear();
    setLoading(true);
    try {
      const params: any = { page: pageArg, perPage };
      if (statusFilter.length > 0) params.resultIds = statusFilter.map(Number);
      if (houseIds.length > 0) params.houseIds = houseIds;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchTerm) params.q = searchTerm;
      const response: PaginatedBetsResponseDto = await fetchBets(params);
      const data = Array.isArray(response?.data) ? response.data : [];
      setApostas((prev) => (append ? [...prev, ...data] : data));
      setTotalPages(response?.totalPages || 1);
      setTotal(response?.total || 0);
      setPage(pageArg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchFilteredBets(1, false), 250);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, houseIds, startDate, endDate]);

  const reload = () => fetchFilteredBets(1, false);
  const handleLoadMore = () => fetchFilteredBets(page + 1, true);

  const changeViewMode = (mode: "agrupado" | "tabela") => {
    selection.clear();
    setViewMode(mode);
  };

  const handleDeleteSelected = async () => {
    if (selectedBets.length === 0) return;
    setConfirmDeleteOpen(false);
    setLoading(true);
    try {
      await deleteMultipleBets(selectedBets);
      setSelectedBets([]);
      await reload();
      actionToast.success({ icon: TrashIcon, title: "Sucesso", description: "Apostas excluídas!" });
    } catch (e: any) {
      actionToast.error({ description: e.message || "Falha ao excluir apostas" });
    } finally {
      setLoading(false);
    }
  };

  // Excluir mais de 2 apostas de uma vez pede confirmação antes; 1 ou 2, exclui direto.
  const handleDeleteSelectedClick = () => {
    if (selectedBets.length > 2) {
      setConfirmDeleteOpen(true);
    } else {
      handleDeleteSelected();
    }
  };

  const handleBulkStatusChange = async (resultId: number) => {
    if (selectedBets.length === 0) return;
    setLoading(true);
    try {
      await finalizeMultipleBets({ betIds: selectedBets, resultId });
      await reload();
      setSelectedBets([]);
      actionToast.success({ icon: Check, title: "Status atualizado", description: "Apostas alteradas!" });
    } catch (e: any) {
      actionToast.error({ description: e.message || "Falha ao atualizar status" });
    } finally {
      setLoading(false);
    }
  };

  // Ação em lote da seleção múltipla (Agrupado): optimistic update na lista +
  // desfazer por ~5s. Undo restaura o status original de cada aposta — usa o
  // endpoint em lote de novo quando os originais eram todos iguais (comum:
  // marcar um grupo de pendentes), senão cai pra 1 chamada por aposta (só no
  // desfazer, já que aí os valores realmente diferem por item).
  const handleBulkFinalize = async (resultId: ResultIdEnum) => {
    const ids = Array.from(selection.selected);
    if (ids.length === 0) return;
    const previous = apostas
      .filter((a) => ids.includes(a.id))
      .map((a) => ({ id: a.id, resultId: a.resultId, resultName: a.resultName }));

    setApostas((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, resultId, resultName: statusLabelFor[resultId] ?? a.resultName } : a)));
    setBulkLoading(true);
    try {
      await finalizeMultipleBets({ betIds: ids, resultId });
      selection.clear();

      const undo = async () => {
        const uniqueOriginal = new Set(previous.map((p) => p.resultId));
        if (uniqueOriginal.size === 1) {
          await finalizeMultipleBets({ betIds: previous.map((p) => p.id), resultId: previous[0].resultId });
        } else {
          await Promise.all(previous.map((p) => finalizeBet(p.id, { resultId: p.resultId })));
        }
        await reload();
        actionToast.success({ icon: ArrowCounterClockwise, title: "Alteração desfeita" });
      };

      actionToast.success({
        icon: CheckCircle,
        title: (
          <>
            {ids.length} apostas marcadas como{" "}
            <span className={statusWordClassFor[resultId] ?? undefined}>{statusLabelFor[resultId] ?? "atualizada"}</span>
          </>
        ),
        action: { label: "Desfazer", onClick: undo },
      });
      await reload();
    } catch (e) {
      setApostas((prev) => prev.map((a) => {
        const orig = previous.find((p) => p.id === a.id);
        return orig ? { ...a, resultId: orig.resultId, resultName: orig.resultName } : a;
      }));
      const description = e instanceof Error ? e.message : "Falha ao atualizar status";
      actionToast.error({ description });
    } finally {
      setBulkLoading(false);
    }
  };

  // Exclusão em lote da seleção múltipla (Agrupado) — sem "desfazer" real: ao
  // contrário do status, não há endpoint pra recriar apostas excluídas, então
  // oferecer um botão de desfazer aqui seria enganoso.
  const handleBulkDelete = async () => {
    const ids = Array.from(selection.selected);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await deleteMultipleBets(ids);
      selection.clear();
      await reload();
      actionToast.success({ icon: TrashIcon, title: `${ids.length} apostas excluídas` });
    } catch (e) {
      const description = e instanceof Error ? e.message : "Falha ao excluir apostas";
      actionToast.error({ description });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleFinalize = async (id: number, resultId: ResultIdEnum, cashoutValue?: number) => {
    try {
      await finalizeBet(id, { resultId, cashoutValue });
      await reload();
      actionToast.success({ icon: Check, title: "Aposta liquidada" });
    } catch (e: any) {
      actionToast.error({ description: e.message || "Falha ao liquidar aposta" });
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
      actionToast.success({ icon: Copy, title: "Aposta duplicada" });
    } catch (e: any) {
      actionToast.error({ description: e.message || "Falha ao duplicar aposta" });
    }
  };

  const handleExportCsv = () => {
    const header = ["Data", "Hora", "Evento", "Mercado", "Casa", "Odd", "Stake", "Status", "Retorno"];
    const rows = apostas.map((b) => [
      new Date(b.betTime).toLocaleDateString("pt-BR"),
      new Date(b.betTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
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

  const filterProps = {
    houses,
    initialDateFrom: startDate,
    initialDateTo: endDate,
    initialSearchTerm: searchTerm,
    initialStatus: statusFilter,
    // ApostasFilter (desktop) continua single-select — ponte pro houseIds[] interno.
    initialHouseId: houseIds[0] ? String(houseIds[0]) : "0",
    onSearch: (term: string) => { setSearchTerm(term); setPage(1); },
    onFilterStatus: (status: string[]) => { setStatusFilter(status); setPage(1); },
    onFilterHouse: (id: string) => { setHouseIds(id === "0" ? [] : [Number(id)]); setPage(1); },
    onDateRangeChange: (from: string, to: string) => { setStartDate(from); setEndDate(to); setPeriodPreset("custom"); setPage(1); },
    onClearFilters: () => {
      setStartDate(""); setEndDate(""); setPeriodPreset("tudo");
      setStatusFilter([]); setHouseIds([]); setSearchTerm(""); setPage(1);
    },
    onExportCsv: handleExportCsv,
    isLoading: loading,
  };

  const mobileFilterValue: ApostasFilterState = {
    period: { preset: periodPreset, from: startDate, to: endDate },
    status: statusFilter,
    houseIds,
  };

  const activeMobileFilterCount = [periodPreset !== "mes", statusFilter.length > 0, houseIds.length > 0].filter(Boolean).length;

  return (
    <MainLayout
      title="Apostas"
      subtitle={`${total.toLocaleString("pt-BR")} registros`}
      titleWrapperClassName="flex items-baseline gap-2.5 min-w-0"
      titleClassName="text-[26px] font-semibold tracking-tight shrink-0"
      subtitleClassName="text-[13px] text-zinc-500 truncate"
      hideHeaderBorder
      hideBottomNav={selection.selectionMode}
      mobileHeader={
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button type="button" onClick={() => navigate(-1)} aria-label="Voltar" className="p-1 -ml-1 text-zinc-400 hover:text-white">
              <CaretLeft size={20} />
            </button>
            <h1 className="text-[19px] font-semibold truncate">Apostas</h1>
          </div>
          <div className="flex items-center gap-1 -mr-2">
            <MobileSearchToggle expanded={mobileSearchExpanded} onToggle={() => setMobileSearchExpanded((v) => !v)} />
            {viewMode === "agrupado" && (
              <button
                type="button"
                onClick={() => (selection.selectionMode ? selection.clear() : selection.enter())}
                aria-label={selection.selectionMode ? "Cancelar seleção" : "Selecionar apostas"}
                className={cn("p-2 hover:text-white", selection.selectionMode ? "text-accent" : "text-zinc-400")}
              >
                {selection.selectionMode ? <X size={19} /> : <CheckSquare size={19} />}
              </button>
            )}
            <button
              type="button"
              onClick={() => reload()}
              disabled={loading}
              aria-label="Recarregar apostas"
              className="p-2 text-zinc-400 hover:text-white disabled:opacity-45"
            >
              <ArrowClockwise size={19} className={cn(loading && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              aria-label="Abrir filtros"
              className="relative p-2 text-zinc-400 hover:text-white"
            >
              <SlidersHorizontal size={19} />
              {activeMobileFilterCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-[15px] min-w-[15px] px-[3px] rounded-full bg-accent text-white text-[9px] font-medium flex items-center justify-center">
                  {activeMobileFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      }
      actions={
        <>
          <div className="hidden md:flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => changeViewMode("agrupado")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                viewMode === "agrupado" ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Stack className="h-3.5 w-3.5" /> Agrupado
            </button>
            <button
              type="button"
              onClick={() => changeViewMode("tabela")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                viewMode === "tabela" ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Table className="h-3.5 w-3.5" /> Tabela
            </button>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="hidden md:flex gap-2">
            <Plus size={16} /> Nova aposta
          </Button>
        </>
      }
    >
      <div className="md:hidden">
        <MobileSearchBar
          value={searchTerm}
          onChange={(term) => { setSearchTerm(term); setPage(1); }}
          resultsCount={total}
          open={mobileSearchExpanded}
          onClose={() => setMobileSearchExpanded(false)}
        />
      </div>

      {/* Chips de status rápido — só mobile, substitui o multi-select da toolbar desktop */}
      <div className="flex md:hidden gap-2 overflow-x-auto pb-3 -mx-4 px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {mobileStatusPills.map((pill) => {
          const isActive =
            pill.value.length === 0 ? statusFilter.length === 0 : statusFilter.length === 1 && statusFilter[0] === pill.value[0];
          return (
            <button
              key={pill.label}
              type="button"
              onClick={() => { setStatusFilter(pill.value); setPage(1); }}
              className={cn(
                "shrink-0 h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors",
                isActive ? "bg-blue-600 text-white" : "border border-white/10 bg-transparent text-zinc-400"
              )}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 min-w-0">
        {/* Breakpoint alinhado com o mobileHeader/sheets (isMobile, 640px) — antes
            usava md: (768px) e deixava 640-767px sem nenhum filtro visível. */}
        {!isMobile && <ApostasFilter {...filterProps} />}

        <div
          className={cn(
            "space-y-3 min-w-0",
            !(isMobile && viewMode === "agrupado") && "card elev-sm bg-card rounded-md p-[14px_16px]"
          )}
        >
          {viewMode === "tabela" && (
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
                      <SelectItem value={String(ResultIdEnum.HALF_WON)}>Meia Ganha</SelectItem>
                      <SelectItem value={String(ResultIdEnum.HALF_LOST)}>Meia Perdida</SelectItem>
                      <SelectItem value={String(ResultIdEnum.CANCELED)}>Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" size="sm" onClick={handleDeleteSelectedClick} disabled={loading} className="gap-2">
                    <Trash size={14} /> Excluir selecionadas
                  </Button>
                </div>
              )}
            </div>
          )}

          {viewMode === "agrupado" ? (
            <ApostasGrouped
              apostas={apostas}
              isLoading={loading}
              selection={selection}
              onEdit={(a) => { setEditAposta(a); setEditModalOpen(true); }}
              onDuplicate={handleDuplicate}
              onFinalize={handleFinalize}
              onDelete={async (id) => {
                setLoading(true);
                try {
                  await deleteBet(id);
                  await reload();
                  actionToast.success({ icon: TrashIcon, title: "Sucesso", description: "Aposta excluída!" });
                } catch (e: any) {
                  actionToast.error({ description: e.message || "Falha ao excluir aposta" });
                } finally {
                  setLoading(false);
                }
              }}
            />
          ) : (
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
                  actionToast.success({ icon: TrashIcon, title: "Sucesso", description: "Aposta excluída!" });
                } catch (e: any) {
                  actionToast.error({ description: e.message || "Falha ao excluir aposta" });
                } finally {
                  setLoading(false);
                }
              }}
              selectedBets={selectedBets}
              onSelectBet={(id) => setSelectedBets((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]))}
              showCheckboxes
            />
          )}

          {isMobile ? (
            apostas.length > 0 && page < totalPages && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loading} className="gap-2">
                  <CaretDown size={14} />
                  Carregar mais ({apostas.length}/{total})
                </Button>
              </div>
            )
          ) : (
          <div className="flex items-center justify-between pt-2">
            <p className="text-[12.5px] opacity-45">
              {apostas.length > 0 ? `${(page - 1) * perPage + 1}–${(page - 1) * perPage + apostas.length}` : "0"} de {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => page > 1 && fetchFilteredBets(page - 1, false)}
                disabled={page <= 1}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-foreground/[0.07] disabled:opacity-35"
              >
                <CaretLeft size={14} />
              </button>
              {pageWindow.map((p, i) => (
                <span key={p} className="flex items-center">
                  {i > 0 && pageWindow[i - 1] !== p - 1 && <span className="px-1 opacity-35 text-xs">…</span>}
                  <button
                    onClick={() => fetchFilteredBets(p, false)}
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
                onClick={() => page < totalPages && fetchFilteredBets(page + 1, false)}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-foreground/[0.07] disabled:opacity-35"
              >
                <CaretRight size={14} />
              </button>
            </div>
          </div>
          )}
        </div>

        <ApostaFormModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onApostaAdded={() => { setCreateModalOpen(false); reload(); }} />
        {editAposta && (
          <EditApostaModal
            aposta={editAposta}
            isOpen={editModalOpen}
            onClose={() => { setEditModalOpen(false); setEditAposta(null); }}
            onApostaUpdated={() => { setEditModalOpen(false); setEditAposta(null); reload(); }}
          />
        )}

        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {selectedBets.length} apostas?</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a excluir {selectedBets.length} apostas selecionadas. Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSelected}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* FAB mobile — substitui o botão "Nova aposta" do header em telas estreitas */}
      <button
        type="button"
        onClick={() => setCreateModalOpen(true)}
        aria-label="Nova aposta"
        className="md:hidden fixed right-4 z-40 h-14 w-14 rounded-full bg-white text-zinc-900 flex items-center justify-center"
        style={{ bottom: "calc(72px + env(safe-area-inset-bottom))", boxShadow: "var(--shadow-lg)" }}
      >
        <Plus size={22} weight="bold" />
      </button>

      <MobileFiltersSheet
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
        value={mobileFilterValue}
        houses={houses}
        onApply={(next) => {
          setPeriodPreset(next.period.preset);
          setStartDate(next.period.from);
          setEndDate(next.period.to);
          setStatusFilter(next.status);
          setHouseIds(next.houseIds);
          setPage(1);
        }}
      />

      <BulkActionBar
        count={selection.selected.size}
        loading={bulkLoading}
        onSetStatus={handleBulkFinalize}
        onDelete={handleBulkDelete}
        onCancel={selection.clear}
      />
    </MainLayout>
  );
}
