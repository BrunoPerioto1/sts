import { useQuery } from "@tanstack/react-query";
import { getSports, type SportDto } from "@/api/routes/get-sports";

const SPORTS_KEY = ["sports"] as const;

export interface SportOption {
  id: number;
  name: string;
}

// Fora do componente: o `select` do react-query só reaproveita o resultado
// memoizado se a função mantiver a identidade entre renders (mesma razão do
// useHouses).
const toOptions = (rows: SportDto[]): SportOption[] =>
  rows.map((s) => ({ id: Number(s.id), name: s.name }));

const EMPTY_OPTIONS: SportOption[] = [];

// Catálogo de esportes dos filtros. Muda ainda menos que as casas — cache
// longo e nenhuma revalidação por foco.
export function useSports(): SportOption[] {
  const { data } = useQuery({
    queryKey: [...SPORTS_KEY, "all"],
    queryFn: getSports,
    select: toOptions,
    staleTime: 30 * 60 * 1000,
  });
  return data ?? EMPTY_OPTIONS;
}
