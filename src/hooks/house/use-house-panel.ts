import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { HouseBalanceDto } from "@/api/routes/get-houses";

export type HousePanelKind = "detail" | "history";

// Detalhe e histórico da casa são telas empilhadas por cima da lista, guardadas
// na URL (?panel=&houseId=) pra que o botão "voltar" do sistema as feche.
export function useHousePanel(houses: HouseBalanceDto[]) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const panel = searchParams.get("panel") as HousePanelKind | null;
  const houseId = Number(searchParams.get("houseId"));

  const push = (house: HouseBalanceDto, kind: HousePanelKind) => {
    const next = new URLSearchParams(searchParams);
    next.set("houseId", String(house.houseId));
    next.set("panel", kind);
    setSearchParams(next, { state: { housePanel: true } });
  };

  return {
    panel,
    house: houses.find((h) => h.houseId === houseId),
    pushDetail: (house: HouseBalanceDto) => push(house, "detail"),
    pushHistory: (house: HouseBalanceDto) => push(house, "history"),
    pop: () => {
      if (location.state?.housePanel) navigate(-1);
      else setSearchParams({}, { replace: true });
    },
  };
}
