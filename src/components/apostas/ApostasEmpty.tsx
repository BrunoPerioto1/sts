import { Receipt } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Vazio das duas visões de aposta. Com filtro ativo oferece a saída (limpar);
 * sem filtro nenhum, o que falta é a primeira aposta — dizer "critérios de
 * busca" nesse caso era confuso, porque não havia busca alguma.
 */
export function ApostasEmpty({ hasFilters, onClearFilters }: { hasFilters?: boolean; onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={<Receipt size={30} />}
      title={hasFilters ? "Nenhuma aposta encontrada" : "Nenhuma aposta registrada ainda"}
      description={
        hasFilters
          ? "Nenhuma aposta corresponde aos filtros aplicados."
          : "Registre sua primeira aposta pelo Telegram ou pelo botão de nova aposta."
      }
      action={
        hasFilters && onClearFilters ? (
          <Button variant="outline" onClick={onClearFilters}>Limpar filtros</Button>
        ) : undefined
      }
    />
  );
}
