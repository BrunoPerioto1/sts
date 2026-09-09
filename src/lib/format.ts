// Aceita string porque o backend devolve decimais como string (numeric do
// Postgres) — as telas de casa passavam o valor cru.
export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
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

// Máscara de valor "de trás pra frente": os dígitos digitados preenchem os
// centavos primeiro (ex: "1050" -> "10,50"), padrão comum em apps BR.
export function centsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Aceita tanto vírgula quanto ponto como separador decimal na digitação.
export function parsePtBrNumber(raw: string): number {
  return Number(raw.trim().replace(",", "."));
}

// dd/mm/aaaa e hh:mm — os dois formatos que a lista, o detalhe e o histórico
// repetem. Variações com mês por extenso continuam inline, são de uma tela só.
export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatTime(value: string | number | Date): string {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Iniciais de nome de usuário/casa pro avatar redondo.
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// mm:ss pro tempo que falta (bloqueio de login, validade do código do Telegram).
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
