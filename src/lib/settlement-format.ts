const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// A stake aparece ao lado da odd o tempo todo; centavos zerados em toda linha
// só engrossam a coluna sem informar nada.
export function stakeCurta(value: number): string {
  return Number.isInteger(value) ? `R$ ${value.toLocaleString("pt-BR")}` : BRL.format(value);
}
