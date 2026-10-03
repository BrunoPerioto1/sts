import { houseActivity } from "./house-activity.ts";

interface HouseLike {
  realHouseBalance: string | number;
  openStake?: string | number;
  lastBetAt: string | null;
}

/**
 * O saldo real conta a stake das apostas em aberto (pendente ainda não tem
 * lucro), mas a casa mostra o saldo já sem elas. Separado, "disponível" bate
 * com o que aparece no site da casa e "em aberto" diz quanto está preso.
 * Negativo não é dívida: é lançamento faltando ("a conferir").
 */
export function houseMoney(house: HouseLike) {
  const real = Number(house.realHouseBalance);
  const open = Math.max(0, Number(house.openStake ?? 0));
  return {
    available: Math.max(0, real - open),
    open,
    shortfall: Math.min(0, real),
  };
}

export type HouseGroupId = "inUse" | "stopped" | "unused";

const LABELS: Record<HouseGroupId, { label: string; hint: string }> = {
  inUse: { label: "Em uso", hint: "aposta recente ou saldo esperando" },
  stopped: { label: "Paradas", hint: "sem apostar há mais tempo que o seu limite" },
  unused: { label: "Sem uso", hint: "nunca apostou e sem saldo" },
};

/**
 * Três blocos pra lista de casas. A ordem dentro de cada um é a da entrada
 * (quem chama já ordenou pelo critério escolhido).
 */
export function groupHouses<T extends HouseLike>(houses: T[], staleDays: number, now: number = Date.now()) {
  const byId: Record<HouseGroupId, T[]> = { inUse: [], stopped: [], unused: [] };
  for (const house of houses) {
    const real = Number(house.realHouseBalance);
    const activity = houseActivity(house.lastBetAt, real, staleDays, now);
    if (activity.kind === "never") byId[real > 0 ? "inUse" : "unused"].push(house);
    else if (activity.kind === "active") byId.inUse.push(house);
    else byId.stopped.push(house);
  }
  return (Object.keys(byId) as HouseGroupId[])
    .filter((id) => byId[id].length > 0)
    .map((id) => ({ id, ...LABELS[id], houses: byId[id] }));
}
