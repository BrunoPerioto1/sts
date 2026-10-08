// Modelo de fonte de tips: onde, na mensagem do tipster, está cada campo.
// Espelho de meu-bot-telegram/src/tip-sources/tip-template.ts — quem lê a
// mensagem de verdade é o backend (a prévia da tela vem de lá). Daqui só sai a
// regra inferida de um trecho marcado, e ela precisa da mesma semântica:
// `after` é a 1ª ocorrência sem diferenciar maiúscula (dentro da linha, se
// houver `line`), `line` conta só linhas com texto a partir de 1, o valor vai
// até `until` ou o fim da linha.

export const TEMPLATE_FIELDS = ["house", "game", "sport", "market", "odd", "limit", "percent"] as const;
export type TemplateField = (typeof TEMPLATE_FIELDS)[number];

export interface FieldRule {
  line?: number;
  after?: string;
  until?: string;
  fixed?: string;
}

export interface TipTemplate {
  marker?: string;
  fields: Partial<Record<TemplateField, FieldRule>>;
}

export const FIELD_META: Record<TemplateField, { label: string; short: string; required: boolean; numeric: boolean; example: string }> = {
  house: { label: "Casa", short: "Casa", required: true, numeric: false, example: "Bet365" },
  game: { label: "Jogo", short: "Jogo", required: true, numeric: false, example: "Flamengo x Palmeiras" },
  sport: { label: "Esporte", short: "Esporte", required: true, numeric: false, example: "Futebol" },
  market: { label: "Mercado", short: "Mercado", required: true, numeric: false, example: "Over 2.5 gols" },
  odd: { label: "Odd", short: "Odd", required: true, numeric: true, example: "1,85" },
  limit: { label: "Limite (R$)", short: "Limite", required: false, numeric: true, example: "R$ 50" },
  percent: { label: "% da banca", short: "%", required: true, numeric: true, example: "2%" },
};

export type RuleMode = "after" | "line" | "fixed" | "off";

/**
 * Modo escolhido no formulário, pela chave presente: `{ after: "" }` é "depois
 * do texto" ainda sem o texto, não campo desligado.
 */
export function ruleMode(rule: FieldRule | undefined): RuleMode {
  if (!rule) return "off";
  if (rule.fixed !== undefined) return "fixed";
  if (rule.line !== undefined) return "line";
  if (rule.after !== undefined) return "after";
  return "off";
}

/** A regra aponta pra algum lugar (o backend recusa texto só de espaço). */
export function isUsable(rule: FieldRule | undefined): boolean {
  switch (ruleMode(rule)) {
    case "fixed":
      return !!rule!.fixed!.trim();
    case "line":
      return true;
    case "after":
      return !!rule!.after!.trim();
    default:
      return false;
  }
}

/** Campos obrigatórios que ainda não têm regra. */
export function missingRules(template: TipTemplate): TemplateField[] {
  return TEMPLATE_FIELDS.filter((f) => FIELD_META[f].required && !isUsable(template.fields[f]));
}

/** Tira do modelo regra desligada e texto vazio — o que vai pro backend. */
export function cleanTemplate(template: TipTemplate): TipTemplate {
  const fields: TipTemplate["fields"] = {};
  for (const f of TEMPLATE_FIELDS) {
    const rule = template.fields[f];
    const mode = ruleMode(rule);
    if (!rule || !isUsable(rule)) continue;
    if (mode === "fixed") {
      fields[f] = { fixed: rule.fixed!.trim() };
      continue;
    }
    const clean: FieldRule = {};
    if (rule.line !== undefined) clean.line = rule.line;
    // Sem aparar: " - " é diferente de "-" (o traço de "Saint-Étienne").
    if (rule.after?.trim()) clean.after = rule.after;
    if (rule.until?.trim()) clean.until = rule.until;
    fields[f] = clean;
  }
  const marker = template.marker?.trim();
  return marker ? { marker, fields } : { fields };
}

const lower = (s: string) => s.toLowerCase();

// Linhas com texto, aparadas, com a posição na mensagem (igual ao backend).
function textLines(text: string): [number, number][] {
  const lines: [number, number][] = [];
  let start = 0;
  for (const raw of text.split("\n")) {
    const lead = raw.length - raw.trimStart().length;
    const trimmed = raw.trim();
    if (trimmed) lines.push([start + lead, start + lead + trimmed.length]);
    start += raw.length + 1;
  }
  return lines;
}

interface Anchor {
  anchor: string;
  // Posição da âncora dentro da linha.
  at: number;
  // 0 = só a última palavra antes do valor.
  words: number;
}

// Candidatos a âncora, da última palavra antes do valor pra trás ("Odd:",
// "Hoje Odd:"...). Cada um também com o espaço em volta: " - " acha o
// separador sem cair no traço de "Saint-Étienne".
function anchorCandidates(prefix: string): Anchor[] {
  const starts: number[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prefix))) starts.push(m.index);

  const out: Anchor[] = [];
  starts
    .reverse()
    .slice(0, 3)
    .forEach((s, words) => {
      out.push({ anchor: prefix.slice(s).trimEnd(), at: s, words });
      if (s > 0 && /\s/.test(prefix[s - 1])) out.push({ anchor: prefix.slice(s - 1), at: s - 1, words });
    });
  return out;
}

// Âncora boa pra mensagem inteira parece rótulo: sem número (número muda de
// uma tip pra outra) e não é palavra curta solta ("na" aparece em
// "Internacional").
function looksLikeLabel(anchor: string) {
  const a = anchor.trim();
  return !/\d/.test(a) && (a.length >= 3 || /[^\p{L}]/u.test(a));
}

/**
 * Regra que lê o trecho [start, end) do exemplo. Prefere rótulo ("depois de
 * Odd:"), que sobrevive a linha a mais ou a menos; sem rótulo à esquerda,
 * vai pela posição da linha. O admin ajusta no formulário se o palpite errar —
 * a prévia mostra na hora o que a regra lê.
 */
export function inferRule(text: string, start: number, end: number, field: TemplateField): FieldRule | null {
  // Seleção com espaço sobrando nas pontas, ou atravessando linhas: fica com a
  // primeira linha, aparada.
  while (start < end && /\s/.test(text[start])) start++;
  const newline = text.indexOf("\n", start);
  if (newline !== -1 && newline < end) end = newline;
  while (end > start && /\s/.test(text[end - 1])) end--;
  if (start >= end) return null;

  const lines = textLines(text);
  const lineIndex = lines.findIndex(([ls, le]) => start >= ls && start <= le);
  if (lineIndex === -1) return null;
  const [lineStart, lineEnd] = lines[lineIndex];
  const line = lineIndex + 1;
  const prefix = text.slice(lineStart, start);
  const suffix = text.slice(end, lineEnd);

  const rule: FieldRule = {};
  if (!prefix.trim()) {
    rule.line = line;
  } else {
    const candidates = anchorCandidates(prefix);
    // 1º: a última palavra, se parece rótulo e, procurada na mensagem
    // inteira, cai exatamente aqui. Mais de uma palavra na mensagem inteira
    // costuma levar dado junto ("Lyon -"), que muda na próxima tip.
    const global = candidates.find(
      (c) => c.words === 0 && looksLikeLabel(c.anchor) && lower(text).indexOf(lower(c.anchor)) === lineStart + c.at,
    );
    if (global) {
      rule.after = global.anchor;
    } else {
      // 2º: dentro da própria linha, que fica presa pela posição.
      const lineText = lower(text.slice(lineStart, lineEnd));
      const local = candidates.find((c) => lineText.indexOf(lower(c.anchor)) === c.at);
      rule.line = line;
      rule.after = local?.anchor ?? prefix;
    }
  }

  // Número: o backend pega o primeiro número depois do começo, o resto da
  // linha não atrapalha.
  if (!FIELD_META[field].numeric && suffix.trim()) {
    const until = untilFor(suffix);
    if (until) rule.until = until;
  }
  return rule;
}

// O separador logo depois do valor (" - ", " @", " |", " ("). Só a
// pontuação: palavra ou número ali é dado (hora, nome), muda na próxima tip —
// sem separador o valor vai até o fim da linha.
function untilFor(suffix: string): string | null {
  const m = suffix.match(/^(\s*)([^\p{L}\p{N}\s]+)(\S*)(\s?)/u);
  if (!m) return null;
  const [, lead, punct, rest, trail] = m;
  return lead + punct + (rest ? "" : trail);
}

/** Primeira ocorrência do identificador (sem diferenciar maiúscula), pro destaque. */
export function markerSpan(text: string, marker: string | undefined): [number, number] | null {
  const m = marker?.trim();
  if (!m) return null;
  const at = lower(text).indexOf(lower(m));
  return at === -1 ? null : [at, at + m.length];
}

/** Descrição curta da regra, pra lista de fontes. */
export function describeRule(rule: FieldRule | undefined): string {
  switch (ruleMode(rule)) {
    case "fixed":
      return `sempre "${rule!.fixed}"`;
    case "line":
      return rule!.after ? `linha ${rule!.line}, depois de "${rule!.after.trim()}"` : `linha ${rule!.line}`;
    case "after":
      return `depois de "${rule!.after!.trim()}"`;
    default:
      return "—";
  }
}
