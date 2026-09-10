import { useEffect, useRef, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ApostasGrouped } from "@/components/apostas/ApostasGrouped";
import { ApostaFormModal } from "@/components/apostas/ApostaFormModal";
import { pickImage } from "@/hooks/apostas/use-bet-slip-scan";
import { EditApostaModal } from "@/components/apostas/EditApostaModal";
import { ApostasFilter } from "@/components/apostas/ApostasFilter";
import { ApostasMobileHeader } from "@/components/apostas/ApostasMobileHeader";
import { ApostasPagination } from "@/components/apostas/ApostasPagination";
import { BulkActionBar } from "@/components/apostas/BulkActionBar";
import { MobileFiltersSheet } from "@/components/apostas/MobileFiltersSheet";
import { MobileStatusPills } from "@/components/apostas/MobileStatusPills";
import { MobileSearchBar } from "@/components/apostas/MobileSearchHeader";
import { useBulkSelection } from "@/hooks/apostas/use-bulk-selection";
import { exportBetsListCsv } from "@/lib/bet-exports";
import { type BetItem, type PaginatedBetsResponseDto } from "@/api/routes/get-bets";
import { useHouses } from "@/hooks/queries/use-houses";
import { betsQueryKey, useBetsQuery } from "@/hooks/apostas/use-bets-query";
import { useApostasFilters } from "@/hooks/apostas/use-apostas-filters";
import { useBetActions } from "@/hooks/apostas/use-bet-actions";
import { Button } from "@/components/ui/button";
import { CaretDown, Plus } from "@phosphor-icons/react";
import { tapHaptic } from "@/lib/haptics";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";

// Referencia estavel pro useMemo de `apostas` enquanto a query nao respondeu.
const EMPTY_PAGES: PaginatedBetsResponseDto[] = [];

export default function ApostasPage() {
  const isMobile = useIsMobile();
  const houses = useHouses();
  const filters = useApostasFilters();
  const selection = useBulkSelection();

  const [editAposta, setEditAposta] = useState<BetItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);

  // Ctrl+V na lista abre o modal já lendo o print. Ignora colagem dentro de
  // campo de texto (a busca, por exemplo) e não faz nada com o modal aberto —
  // ali o próprio formulário já escuta o paste.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (createModalOpen || editModalOpen) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      const file = pickImage(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      setPastedImage(file);
      setCreateModalOpen(true);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [createModalOpen, editModalOpen]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const betsQuery = useBetsQuery(filters.queryFilters);
  const queryKey = betsQueryKey(filters.queryFilters);

  const pages = betsQuery.data?.pages ?? EMPTY_PAGES;
  const apostas = useMemo(() => pages.flatMap((p) => p.data ?? []), [pages]);
  const total = pages[0]?.total ?? 0;
  const totalPages = pages[0]?.totalPages ?? 1;
  const page = filters.pageStart + Math.max(0, pages.length - 1);

  const actions = useBetActions({ queryKey, apostas });
  // isPending, não isFetching: com a lista já em cache a tela aparece pronta e
  // a revalidação roda por baixo. Usar isFetching aqui traria o skeleton de
  // volta a cada volta pra tela — exatamente o que o cache veio evitar.
  const loading = betsQuery.isPending || actions.mutating;
  const refreshing = betsQuery.isFetching || actions.mutating;

  // Antes o fetch limpava a seleção; agora a query é declarativa, então limpa
  // quando o conjunto exibido muda — trocar filtro com apostas marcadas
  // deixaria marcada uma aposta que nem está mais na lista.
  useEffect(() => {
    selection.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.statusFilter, filters.houseIds, filters.startDate, filters.endDate, filters.debouncedSearch]);

  useEffect(() => {
    if (!selection.selectionMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") selection.clear();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.selectionMode, selection.clear]);

  // O input só existe depois que a busca abre, então o `focus()` precisa vir
  // no MESMO gesto do toque — daí o flushSync, que monta a barra antes do
  // handler terminar. Focar num efeito/timeout depois já está fora do gesto e
  // o iOS ignora, abrindo o campo sem o teclado.
  const toggleMobileSearch = () => {
    if (mobileSearchExpanded) {
      setMobileSearchExpanded(false);
      return;
    }
    flushSync(() => setMobileSearchExpanded(true));
    searchInputRef.current?.focus();
  };

  // Puxar do topo substitui o botao de recarregar que saiu do header mobile.
  const pull = usePullToRefresh(actions.reload, isMobile);

  const filterProps = {
    houses,
    initialDateFrom: filters.startDate,
    initialDateTo: filters.endDate,
    initialSearchTerm: filters.searchTerm,
    initialStatus: filters.statusFilter,
    initialHouseId: filters.houseIds[0] ? String(filters.houseIds[0]) : "0",
    onSearch: filters.setSearch,
    onFilterStatus: filters.setStatus,
    onFilterHouse: filters.setHouseFromSelect,
    onDateRangeChange: filters.setDateRange,
    onClearFilters: filters.clearFilters,
    onExportCsv: () => exportBetsListCsv(apostas),
    isLoading: loading,
  };

  const listProps = {
    apostas,
    isLoading: loading,
    hasFilters: filters.hasFilters,
    onClearFilters: filters.clearFilters,
    onEdit: (a: BetItem) => { setEditAposta(a); setEditModalOpen(true); },
    onDuplicate: actions.duplicate,
    onFinalize: actions.finalizeOne,
  };

  return (
    <MainLayout
      title="Apostas"
      subtitle={`${total.toLocaleString("pt-BR")} registros`}
      titleWrapperClassName="flex items-baseline gap-2.5 min-w-0"
      titleClassName="text-2xl font-semibold tracking-tight shrink-0"
      subtitleClassName="text-sm text-zinc-500 truncate"
      hideHeaderBorder
      hideBottomNav={selection.selectionMode}
      mobileHeader={
        <ApostasMobileHeader
          searchExpanded={mobileSearchExpanded}
          onToggleSearch={toggleMobileSearch}
          onOpenFilters={() => setMobileFilterOpen(true)}
          activeFilterCount={filters.activeMobileFilterCount}
        />
      }
      actions={
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="hidden md:flex gap-2 bg-accent text-white hover:bg-accent/90"
        >
          <Plus size={16} /> Nova aposta
        </Button>
      }
    >
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />

      <div className="md:hidden">
        <MobileSearchBar
          value={filters.searchTerm}
          onChange={filters.setSearch}
          resultsCount={total}
          open={mobileSearchExpanded}
          onClose={() => setMobileSearchExpanded(false)}
          inputRef={searchInputRef}
        />
      </div>

      <MobileStatusPills value={filters.statusFilter} onChange={filters.setStatus} />

      <div className="space-y-4 min-w-0">
        {/* Breakpoint alinhado com o mobileHeader/sheets (isMobile, 640px) — antes
            usava md: (768px) e deixava 640-767px sem nenhum filtro visível. */}
        {!isMobile && <ApostasFilter {...filterProps} />}

        {/* Sem card em volta: a lista agrupada desenha as próprias divisões, e
            a caixa cinza só criava uma moldura dentro de outra. */}
        <div className="space-y-3 min-w-0">
          <ApostasGrouped
            {...listProps}
            selection={selection}
            onDelete={(id) => actions.deleteOne(id)}
          />

          {isMobile ? (
            apostas.length > 0 && page < totalPages && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" size="sm" onClick={() => void betsQuery.fetchNextPage()} disabled={refreshing} className="gap-2">
                  <CaretDown size={14} />
                  Carregar mais ({apostas.length}/{total})
                </Button>
              </div>
            )
          ) : (
            <ApostasPagination
              page={page}
              totalPages={totalPages}
              perPage={filters.perPage}
              loadedCount={apostas.length}
              total={total}
              onPageChange={filters.setPageStart}
            />
          )}
        </div>

        <ApostaFormModal
          open={createModalOpen}
          onClose={() => { setCreateModalOpen(false); setPastedImage(null); }}
          onApostaAdded={() => { setCreateModalOpen(false); setPastedImage(null); actions.reload(); }}
          pendingImage={pastedImage}
          onPendingImageConsumed={() => setPastedImage(null)}
        />
        {editAposta && (
          <EditApostaModal
            aposta={editAposta}
            isOpen={editModalOpen}
            onClose={() => { setEditModalOpen(false); setEditAposta(null); }}
            onApostaUpdated={() => { setEditModalOpen(false); setEditAposta(null); actions.reload(); }}
          />
        )}

      </div>

      {/* FAB mobile — substitui o botão "Nova aposta" do header em telas estreitas */}
      <button
        type="button"
        onClick={() => {
          tapHaptic();
          setCreateModalOpen(true);
        }}
        aria-label="Nova aposta"
        className="press animate-pop-in md:hidden fixed right-4 z-40 h-14 w-14 rounded-full bg-white text-zinc-900 flex items-center justify-center"
        style={{ bottom: "calc(72px + env(safe-area-inset-bottom))", boxShadow: "var(--shadow-lg)" }}
      >
        <Plus size={22} weight="bold" />
      </button>

      <MobileFiltersSheet
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
        value={filters.mobileFilterValue}
        houses={houses}
        onApply={filters.applyMobileFilters}
      />

      <BulkActionBar
        count={selection.selected.size}
        loading={actions.bulkLoading}
        onSetStatus={(resultId) => actions.bulkFinalize(Array.from(selection.selected), resultId, selection.clear)}
        onDelete={() => actions.bulkDelete(Array.from(selection.selected), selection.clear)}
        onCancel={selection.clear}
      />
    </MainLayout>
  );
}
