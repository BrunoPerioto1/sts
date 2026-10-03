import { useState } from "react";
import { groupBets, monthLabel, type MonthGroup } from "@/lib/bet-grouping";
import { type BetItem, type BetMonthSummary, ResultIdEnum } from "@/api/routes/get-bets";
import { useIsMobile } from "@/hooks/use-mobile";
import type { BulkSelection } from "@/hooks/apostas/use-bulk-selection";
import { useMonthBets, type BetsQueryFilters } from "@/hooks/apostas/use-bets-query";
import { ApostaDetailSheet } from "./ApostaDetailSheet";
import { ApostasEmpty } from "./ApostasEmpty";
import { ApostasGroupedDesktop } from "./ApostasGroupedDesktop";
import { ApostasGroupedMobile } from "./ApostasGroupedMobile";
import { ApostasListSkeleton } from "./ApostasListSkeleton";
import { ApostasMobileSkeleton } from "./ApostasMobileSkeleton";

interface ApostasGroupedProps {
  filters: BetsQueryFilters;
  /** Meses do filtro com quantidade e lucro (GET /bets/monthly-summary). */
  months: BetMonthSummary[];
  isLoading?: boolean;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onEdit?: (aposta: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (aposta: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
  selection: BulkSelection;
}

// Visão "Agrupado": mês > dia. Os totais de cada mês vêm prontos do banco; as
// linhas só do mês aberto (antes a tela baixava o filtro inteiro pra somar).
// Estado de expansão e de detalhe ficam aqui, o único ponto comum ao desktop e
// ao mobile.
export function ApostasGrouped({ filters, months, isLoading, onEdit, onDelete, onDuplicate, onFinalize, selection, hasFilters, onClearFilters }: ApostasGroupedProps) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailAposta, setDetailAposta] = useState<BetItem | null>(null);

  // O mês mais recente abre sozinho; os outros só quando o usuário abre.
  const firstKey = months[0]?.month;
  const isMonthOpen = (key: string) => expanded[key] ?? key === firstKey;
  const toggleMonth = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? key === firstKey) }));
  };

  const openMonths = months.map((m) => m.month).filter(isMonthOpen);
  const loaded = useMonthBets(filters, openMonths);

  const groups: MonthGroup[] = months.map((m) => {
    const month = loaded.get(m.month);
    return {
      key: m.month,
      label: monthLabel(m.month),
      count: m.count,
      total: m.profit,
      // groupBets separa por semana/dia; o mês já é este (achata por garantia,
      // caso o fuso do aparelho não seja o de SP e alguma aposta de borda caia
      // no mês vizinho).
      weeks: month ? groupBets(month.bets).flatMap((g) => g.weeks) : [],
      loading: month?.loading,
    };
  });

  const orderedIds = groups.flatMap((m) => m.weeks.flatMap((w) => w.days.flatMap((d) => d.bets.map((b) => b.id))));

  // So mostra esqueleto quando NAO ha nada na tela ainda. Em recarga (editar,
  // liquidar, mudar status) trocar a lista inteira por um esqueleto de poucas
  // linhas desabava a altura da pagina, o browser prendia o scroll no novo
  // maximo (~0) e a tela voltava pro topo. Mantendo a lista montada durante o
  // refetch, a posicao do scroll fica onde estava — o spinner do header ja
  // sinaliza o carregamento.
  if (isLoading && months.length === 0) {
    return isMobile ? <ApostasMobileSkeleton /> : <ApostasListSkeleton />;
  }

  if (months.length === 0) {
    return <ApostasEmpty hasFilters={hasFilters} onClearFilters={onClearFilters} />;
  }

  return (
    <>
      {isMobile ? (
        <ApostasGroupedMobile
          groups={groups}
          selection={selection}
          isMonthOpen={isMonthOpen}
          onToggleMonth={toggleMonth}
          onOpenDetail={setDetailAposta}
        />
      ) : (
        <ApostasGroupedDesktop
          groups={groups}
          selection={selection}
          orderedIds={orderedIds}
          isMonthOpen={isMonthOpen}
          onToggleMonth={toggleMonth}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onFinalize={onFinalize}
        />
      )}
      <ApostaDetailSheet
        aposta={detailAposta}
        onClose={() => setDetailAposta(null)}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onFinalize={onFinalize}
      />
    </>
  );
}
