import { useQueryClient } from "@tanstack/react-query";

// Registrar/editar/liquidar/excluir aposta e movimentar casa mexem em tudo ao
// mesmo tempo: lista de apostas, saldo das casas e metricas do dashboard.
//
// Antes cada tela refazia o GET na montagem, entao dado velho se resolvia
// sozinho. Com o cache ligado (staleTime de 5 min no App.tsx) quem faz mutation
// TEM que chamar isso — senao a outra aba mostra numero velho ate expirar.
export function useInvalidateBetData() {
  const qc = useQueryClient();

  // Devolve promise: invalidateQueries ja refaz sozinho as queries montadas na
  // tela (as das outras so ficam marcadas como velhas), entao dava pra esperar
  // isso em vez de chamar refetch por fora e buscar duas vezes.
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["bets"] }),
      qc.invalidateQueries({ queryKey: ["houses"] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
}
