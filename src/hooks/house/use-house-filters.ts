import { useMemo, useState } from "react";
import type { HouseBalanceDto } from "@/api/routes/get-houses";
import type { HouseSortMobile } from "@/components/house/mobile/SortSheet";

// Busca, chips e ordenação da lista de casas (mobile). "Com saldo" e
// "Negativas" são mutuamente exclusivos: ligar um desliga o outro.
export function useHouseFilters(houses: HouseBalanceDto[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [houseIds, setHouseIds] = useState<number[]>([]);
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const [onlyNegative, setOnlyNegative] = useState(false);
  const [sort, setSort] = useState<HouseSortMobile>("balance");

  const filteredHouses = useMemo(() => {
    let list = houses.filter((h) => h.houseName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (houseIds.length > 0) list = list.filter((h) => houseIds.includes(h.houseId));
    if (onlyWithBalance) list = list.filter((h) => Number(h.houseBalance) > 0);
    if (onlyNegative) list = list.filter((h) => Number(h.realHouseBalance) < 0);
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.houseName.localeCompare(b.houseName);
      if (sort === "profit") return Number(b.totalBetProfit) - Number(a.totalBetProfit);
      if (sort === "bets") return Number(b.totalBets) - Number(a.totalBets);
      if (sort === "lastMovement") return new Date(b.lastMovementAt ?? 0).getTime() - new Date(a.lastMovementAt ?? 0).getTime();
      return Number(b.realHouseBalance) - Number(a.realHouseBalance);
    });
    return list;
  }, [houses, searchTerm, houseIds, onlyWithBalance, onlyNegative, sort]);

  const houseOptions = useMemo(
    () => houses.map((h) => ({ id: h.houseId, name: h.houseName })),
    [houses]
  );

  return {
    searchTerm,
    setSearchTerm,
    houseIds,
    setHouseIds,
    houseOptions,
    onlyWithBalance,
    toggleOnlyWithBalance: () => { setOnlyWithBalance((v) => !v); setOnlyNegative(false); },
    onlyNegative,
    toggleOnlyNegative: () => { setOnlyNegative((v) => !v); setOnlyWithBalance(false); },
    sort,
    setSort,
    filteredHouses,
    hasFilters: !!searchTerm || onlyNegative || onlyWithBalance || houseIds.length > 0,
    clear: () => { setSearchTerm(""); setOnlyNegative(false); setOnlyWithBalance(false); setHouseIds([]); },
  };
}
