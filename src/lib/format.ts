// ─── Números (pt-BR) ────────────────────────────────────────────────────────
// Toda exibição de número passa por aqui. Fica de fora só o que não é leitura:
// valor de campo em edição (centsToDisplay, toPtBr), CSV (ponto, pra planilha)
// e eixo de gráfico (notação compacta do recharts).

const intlCache = new Map<string, Intl.NumberFormat>();
function nf(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let f = intlCache.get(key);
  if (!f) intlCache.set(key, (f = new Intl.NumberFormat("pt-BR", options)));
  return f;
}

// Com sinal, "exceptZero" já trata o zero. Sem sinal, -0,001 sairia "-R$ 0,00":
// zera antes o que arredonda pra zero na precisão exibida. (O signDisplay
// "negative" faria isso, mas lança erro em iOS < 15.4.)
function show(options: Intl.NumberFormatOptions, n: number): string {
  const f = nf(options);
  // Em porcentagem as casas valem depois do ×100.
  const digits = (f.resolvedOptions().maximumFractionDigits ?? 0) + (options.style === "percent" ? 2 : 0);
  return f.format(Math.abs(n) < 0.5 * 10 ** -digits ? 0 : n);
}
const sign = (signed?: boolean): Intl.NumberFormatOptions["signDisplay"] => (signed ? "exceptZero" : "auto");

export interface MoneyOptions {
  /** "+R$ 8,80" no positivo. Zero fica sem sinal. */
  signed?: boolean;
  /** true (padrão): sempre com centavos. false: nunca (cartões compactos).
   *  "auto": só quando o valor tem (stake ao lado da odd: "R$ 50", "R$ 12,50"). */
  cents?: boolean | "auto";
}

// Aceita string porque o backend devolve decimais como string (numeric do Postgres).
export function formatMoney(value: number | string, { signed, cents = true }: MoneyOptions = {}): string {
  const n = Number(value);
  const whole = cents === false || (cents === "auto" && Number.isInteger(n));
  return show({ style: "currency", currency: "BRL", signDisplay: sign(signed), ...(whole && { maximumFractionDigits: 0 }) }, n);
}

export interface PercentOptions {
  signed?: boolean;
  /** Casas decimais (padrão 1). */
  decimals?: number;
  /** Mínimo de casas, se menor que `decimals` ("0,5%" em vez de "0,50%"). */
  minDecimals?: number;
}

/** Recebe a FRAÇÃO (0.261 → "26,1%"), como a API devolve roi e hitRate. */
export function formatPercent(fraction: number | string, { signed, decimals = 1, minDecimals = decimals }: PercentOptions = {}): string {
  return show({ style: "percent", signDisplay: sign(signed), minimumFractionDigits: minDecimals, maximumFractionDigits: decimals }, Number(fraction));
}

/** Unidades de stake, sempre com sinal: "+139,37 U". */
export function formatUnits(value: number): string {
  return `${show({ maximumFractionDigits: 2, signDisplay: "exceptZero" }, value)} U`;
}

/** Contagem: "1.192". */
export function formatInt(value: number | string): string {
  return show({ maximumFractionDigits: 0 }, Number(value));
}

/** Cor pelo sinal: ganho, perda ou neutro (zero e sem valor). */
export function signColor(value: number | null | undefined): "text-success" | "text-danger" | "text-muted" {
  if (value == null || !Number.isFinite(value) || value === 0) return "text-muted";
  return value > 0 ? "text-success" : "text-danger";
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

// Horário de jogo, em duas partes. Separadas porque a lista do desktop empilha
// dia sobre hora numa coluna estreita — junto numa linha só, "Amanhã 11:30"
// não cabia e o dia era justamente o que ficava cortado.
export function kickoffParts(value: string | number | Date): {
  dia: string;
  hora: string;
  eHoje: boolean;
} {
  const date = new Date(value);
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const eHoje = date.toDateString() === hoje.toDateString();
  const dia = eHoje
    ? "Hoje"
    : date.toDateString() === amanha.toDateString()
      ? "Amanhã"
      : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return { dia, hora: formatTime(date), eHoje };
}

// Uma linha só, pro card do mobile e pro painel de detalhe, onde a frase corre
// no texto. "Hoje" fica implícito: numa fila em que quase tudo é de hoje,
// repetir isso em toda linha é ruído.
export function formatKickoff(value: string | number | Date): string {
  const { dia, hora, eHoje } = kickoffParts(value);
  return eHoje ? hora : `${dia} ${hora}`;
}

// Paleta categórica do avatar da casa. Sem verde, vermelho e âmbar puros (são
// ganho, perda e pendente) e com tons escuros o bastante pras iniciais brancas
// passarem de 4.5:1 — o amarelo e o verde-claro antigos davam ~1.5:1.
const AVATAR_PALETTE = ["#4f46e5", "#0e7490", "#0f766e", "#7c3aed", "#c026d3", "#db2777", "#c2410c", "#475569"];

/** Cor do avatar pelo nome (hash), igual em todas as telas e sem depender do id. */
export function houseColor(name: string): string {
  let hash = 0;
  for (const ch of name.trim().toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

// Preposições ficam minúsculas no meio do nome ("Esportes da Sorte"). "bet" é
// palavra, não sigla, apesar das 3 letras ("Esportiva Bet").
const LOWER_WORDS = new Set(["da", "de", "do", "das", "dos", "e"]);
const NOT_ACRONYMS = new Set(["bet"]);

/**
 * Nome da casa em Title Case pra exibir, sem mexer no dado salvo: "BETANO" →
 * "Betano", "ESPORTES DA SORTE" → "Esportes da Sorte". Palavra de até 3 letras
 * fica em maiúscula (sigla: "KTO"). Nome que já vem com minúsculas é mantido
 * como está — alguém escolheu aquela grafia ("BetMGM").
 */
export function houseDisplayName(name: string): string {
  const trimmed = name.trim();
  if (/\p{Ll}/u.test(trimmed)) return trimmed;
  return trimmed
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLocaleLowerCase("pt-BR");
      if (i > 0 && LOWER_WORDS.has(lower)) return lower;
      if (word.length <= 3 && !NOT_ACRONYMS.has(lower)) return word;
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
}

// Nome pra mostrar: o que a pessoa digitou no cadastro. O username é gerado
// pelo servidor ("bruno.souza2") e só aparece quando não há nome.
export function displayName(user: { fullName?: string | null; username: string }): string {
  return user.fullName?.trim() || user.username;
}

/** Duas letras pro avatar da casa: "Esportes da Sorte" → "ES", "Betano" → "BE". */
export function houseInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => w && !LOWER_WORDS.has(w.toLocaleLowerCase("pt-BR")));
  if (!words.length) return "?";
  const pair = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return pair.toLocaleUpperCase("pt-BR");
}

// Iniciais pro avatar redondo do usuário.
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

// Odd com 2 casas, ou 3 quando a terceira existe (1.855). A coluna guarda 3
// desde a migration de precisao; toFixed(2) arredondava 1.855 pra 1.86.
// Ponto e não vírgula de propósito: é a convenção das casas e do mercado.
// `decimals: 2` arredonda de vez (1.895 → 1.90): leitura rápida na fila de
// tips, onde a terceira casa não muda a decisão.
export function formatOdd(value: number | string, { decimals }: { decimals?: 2 } = {}): string {
  if (decimals === 2) return Number(value).toFixed(2);
  const fixed = Number(value).toFixed(3);
  return fixed.endsWith("0") ? fixed.slice(0, -1) : fixed;
}
