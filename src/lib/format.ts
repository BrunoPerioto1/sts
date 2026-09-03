export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

// Intl já coloca o sinal de negativo antes do "R$" sozinho — só falta o "+" no positivo.
export function formatSignedCurrency(value: number): string {
  return value >= 0 ? `+${formatCurrency(value)}` : formatCurrency(value);
}

// Sem centavos — usado em cartões compactos onde o valor exato não cabe/importa.
export function formatCurrencyCompact(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

export function formatSignedCurrencyCompact(value: number): string {
  return value >= 0 ? `+${formatCurrencyCompact(value)}` : formatCurrencyCompact(value);
}

// Aceita tanto vírgula quanto ponto como separador decimal na digitação.
export function parsePtBrNumber(raw: string): number {
  return Number(raw.trim().replace(",", "."));
}
