export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

// Intl já coloca o sinal de negativo antes do "R$" sozinho — só falta o "+" no positivo.
export function formatSignedCurrency(value: number): string {
  return value >= 0 ? `+${formatCurrency(value)}` : formatCurrency(value);
}
