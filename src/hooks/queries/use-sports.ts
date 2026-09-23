import { useQuery } from "@tanstack/react-query";
import { getSports, type SportDto } from "@/api/routes/get-bets";

const EMPTY: SportDto[] = [];

// Esportes do filtro e do form de aposta. Muda só por migration: cache infinito.
export function useSports(): SportDto[] {
  const { data } = useQuery({ queryKey: ["sports"], queryFn: getSports, staleTime: Infinity });
  return data ?? EMPTY;
}

const key = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Esporte da lista que corresponde ao texto livre (IA, aposta antiga). O banco
// normaliza de novo no trigger; aqui é só pro select mostrar o item certo.
export function findSport(sports: SportDto[], value: string | null | undefined): SportDto | undefined {
  if (!value) return undefined;
  const k = key(value);
  return sports.find((s) => key(s.name) === k);
}
