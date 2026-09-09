import { useMemo, useState } from "react";
import { groupBets } from "@/lib/bet-grouping";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import { useIsMobile } from "@/hooks/use-mobile";
import type { BulkSelection } from "@/hooks/apostas/use-bulk-selection";
import { ApostaDetailSheet } from "./ApostaDetailSheet";
import { ApostasEmpty } from "./ApostasEmpty";
import { ApostasGroupedDesktop } from "./ApostasGroupedDesktop";
import { ApostasGroupedMobile } from "./ApostasGroupedMobile";
import { ApostasListSkeleton } from "./ApostasListSkeleton";
import { ApostasMobileSkeleton } from "./ApostasMobileSkeleton";

interface ApostasGroupedProps {
  apostas: BetItem[];
  isLoading?: boolean;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onEdit?: (aposta: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (aposta: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
  selection: BulkSelection;
}

// Visão "Agrupado": agrupa as apostas por mês/semana/dia e delega a renderização
// pra versão desktop ou mobile. Estado de expansão e de detalhe ficam aqui, que
// é o único ponto comum às duas.
export function ApostasGrouped({ apostas, isLoading, onEdit, onDelete, onDuplicate, onFinalize, selection, hasFilters, onClearFilters }: ApostasGroupedProps) {
  const isMobile = useIsMobile();
  const groups = useMemo(() => groupBets(apostas), [apostas]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailAposta, setDetailAposta] = useState<BetItem | null>(null);

  const orderedIds = useMemo(
    () => groups.flatMap((m) => m.weeks.flatMap((w) => w.days.flatMap((d) => d.bets.map((b) => b.id)))),
    [groups]
  );

  const isMonthOpen = (key: string) => expanded[key] ?? key === groups[0]?.key;
  const toggleMonth = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? key === groups[0]?.key) }));
  };

  // So mostra esqueleto quando NAO ha nada na tela ainda. Em recarga (editar,
  // liquidar, mudar status) trocar a lista inteira por um esqueleto de poucas
  // linhas desabava a altura da pagina, o browser prendia o scroll no novo
  // maximo (~0) e a tela voltava pro topo. Mantendo a lista montada durante o
  // refetch, a posicao do scroll fica onde estava — o spinner do header ja
  // sinaliza o carregamento.
  if (isLoading && apostas.length === 0) {
    return isMobile ? <ApostasMobileSkeleton /> : <ApostasListSkeleton />;
  }

  if (apostas.length === 0) {
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
