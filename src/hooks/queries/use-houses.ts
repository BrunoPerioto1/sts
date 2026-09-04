import { useQuery } from "@tanstack/react-query";
import {
  getAllHouses,
  getHouseBalances,
  getHouseMetrics,
  type FindAllHousesDTO,
} from "@/api/routes/get-houses";

export const HOUSES_KEY = ["houses"] as const;

export interface HouseOption {
  id: number;
  name: string;
}

// Fora do componente de proposito: o `select` do react-query so reaproveita o
// resultado memoizado se a funcao mantiver a identidade entre renders. Inline
// ele devolveria um array novo a cada render e quebraria os useMemo de quem
// consome.
const toOptions = (rows: FindAllHousesDTO[]): HouseOption[] =>
  rows.map((h) => ({ id: Number(h.id), name: h.name }));

const EMPTY_OPTIONS: HouseOption[] = [];

// Lista de casas (id/nome) do select de aposta e dos filtros. Praticamente nao
// muda — e o caso mais obvio de cache.
export function useHouses(): HouseOption[] {
  const { data } = useQuery({
    queryKey: [...HOUSES_KEY, "all"],
    queryFn: getAllHouses,
    select: toOptions,
  });
  return data ?? EMPTY_OPTIONS;
}

// getHouseBalances aceita filtro opcional; o wrapper evita o react-query passar
// o QueryFunctionContext como params.
export function useHouseBalances() {
  return useQuery({
    queryKey: [...HOUSES_KEY, "balances"],
    queryFn: () => getHouseBalances(),
  });
}

export function useHouseMetrics() {
  return useQuery({
    queryKey: [...HOUSES_KEY, "metrics"],
    queryFn: getHouseMetrics,
  });
}
