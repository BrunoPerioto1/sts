import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import { ApostaDetailSheet } from "./ApostaDetailSheet";
import { ApostasCardList } from "./ApostasCardList";
import { ApostasEmpty } from "./ApostasEmpty";
import { ApostasListSkeleton } from "./ApostasListSkeleton";
import { ApostasTable } from "./ApostasTable";

interface ApostasListProps {
  apostas: BetItem[];
  onEdit?: (aposta: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (aposta: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
  selectedBets?: number[];
  onSelectBet?: (betId: number) => void;
  showCheckboxes?: boolean;
  isLoading?: boolean;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

// Visão "Tabela": escolhe entre a tabela (desktop) e os cards (mobile), e
// cuida dos estados de carregando/vazio comuns aos dois.
export function ApostasList({
  apostas,
  onEdit,
  onDelete,
  onDuplicate,
  onFinalize,
  selectedBets = [],
  onSelectBet,
  showCheckboxes = false,
  isLoading = false,
  hasFilters = false,
  onClearFilters,
}: ApostasListProps) {
  const isMobile = useIsMobile();
  const [detailAposta, setDetailAposta] = useState<BetItem | null>(null);

  // So mostra esqueleto quando NAO ha nada na tela ainda. Em recarga (editar,
  // liquidar, mudar status) trocar a lista inteira por um esqueleto de poucas
  // linhas desabava a altura da pagina, o browser prendia o scroll no novo
  // maximo (~0) e a tela voltava pro topo. Mantendo a lista montada durante o
  // refetch, a posicao do scroll fica onde estava — o spinner do header ja
  // sinaliza o carregamento.
  if (isLoading && apostas.length === 0) {
    return <ApostasListSkeleton />;
  }

  if (apostas.length === 0) {
    return <ApostasEmpty hasFilters={hasFilters} onClearFilters={onClearFilters} />;
  }

  if (isMobile) {
    return (
      <>
        <ApostasCardList
          apostas={apostas}
          onOpenDetail={setDetailAposta}
          selectedBets={selectedBets}
          onSelectBet={onSelectBet}
          showCheckboxes={showCheckboxes}
        />
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

  return (
    <ApostasTable
      apostas={apostas}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onFinalize={onFinalize}
      selectedBets={selectedBets}
      onSelectBet={onSelectBet}
      showCheckboxes={showCheckboxes}
    />
  );
}
