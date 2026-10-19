// Leitura única do estado de um usuário na tela de admin. Lista, filtros, aba
// Problemas, faixa de alerta e detalhe precisam concordar sobre quem está no
// Grátis ou sobrando no grupo — por isso a régua mora aqui, e não no JSX.
// Vencido = fora do Pro: a conta segue usando o app no Grátis, não é problema.

import type { AdminUser } from "@/api/routes/get-admin";
import { formatSaoPaulo, isLocked } from "@/lib/admin-health";
import { daysUntilAccess, formatAccessDate, isExpired, tipsGroupAction } from "@/lib/access";
import { formatInt } from "@/lib/format";

export type UserState = {
  active: boolean;
  locked: boolean;
  /** Fora do Pro (vencido): está no Grátis. */
  expired: boolean;
  /** Pro acaba nos próximos 7 dias, sem assinatura renovando. */
  expiring: boolean;
  /** Assinatura do Mercado Pago rodando: a mensalidade renova sozinha. */
  subscribed: boolean;
  /** No grupo Tips até onde o bot sabe: vinculado e não tirado pelo painel. */
  inGroup: boolean;
  /** Inativo e ainda no grupo: continua lendo as tips. */
  strayInGroup: boolean;
  groupAction: "remove" | "invite" | null;
  problem: boolean;
};

export function userState(user: AdminUser): UserState {
  const active = user.isActive !== false;
  const locked = isLocked(user.lockedUntil);
  const expired = isExpired(user.accessUntil);
  const subscribed = user.subscriptionStatus === "authorized";
  const expiring = !!user.accessUntil && !expired && !subscribed && daysUntilAccess(user.accessUntil) <= 7;
  const inGroup = user.hasTelegram && !user.tipsGroupRemovedAt;
  const strayInGroup = inGroup && !active;
  return {
    active,
    locked,
    expired,
    expiring,
    subscribed,
    inGroup,
    strayInGroup,
    groupAction: tipsGroupAction(user),
    problem: locked || strayInGroup,
  };
}

// "JOAO VICTOR ALVES" e "rafael lima" viram "Joao Victor Alves" / "Rafael Lima".
// Nome já com caixa mista fica como a pessoa escreveu, e sigla curta ("BP")
// também — "Bp" parece erro de digitação.
export function displayName(user: AdminUser): string {
  const name = user.fullName || user.username;
  if (name.length <= 3 || (name !== name.toUpperCase() && name !== name.toLowerCase())) return name;
  return name
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/ (De|Da|Do|Dos|Das|E) /g, (m) => m.toLowerCase());
}

export const firstName = (user: AdminUser) => displayName(user).split(" ")[0];

export type Tone = "bad" | "warn" | "default" | "muted";

export const TONE_TEXT: Record<Tone, string> = {
  bad: "text-danger",
  warn: "text-warning",
  default: "text-foreground",
  muted: "text-zinc-400",
};

/** Coluna Acesso da lista: "Grátis", "Até 27/10" ou "Sem prazo". */
export function accessLabel(user: AdminUser, state: UserState): { label: string; tone: Tone } {
  if (state.expired) return { label: "Grátis", tone: "muted" };
  if (user.accessUntil) return { label: `Até ${formatAccessDate(user.accessUntil).slice(0, 5)}`, tone: state.expiring ? "warn" : "default" };
  return { label: "Sem prazo", tone: "muted" };
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** "12 contas · 1 admin" — cabeçalho da lista no desktop e no celular. */
export function accountsHeadline(total: number, admins: number): string {
  return `${formatInt(total)} ${plural(total, "conta", "contas")} · ${formatInt(admins)} ${plural(admins, "admin", "admins")}`;
}

/** Seção Acesso do detalhe: título grande e a contagem de dias embaixo. */
export function accessDetail(user: AdminUser, state: UserState, isMe: boolean): { title: string; note: string; tone: Tone } {
  if (!user.accessUntil) {
    return {
      title: "Sem prazo",
      // O servidor recusa prazo na própria conta: não há o que oferecer.
      note: isMe ? "Sua conta não tem vencimento." : "Sem vencimento definido. +30 e +90 criam um prazo.",
      tone: "default",
    };
  }
  const days = daysUntilAccess(user.accessUntil);
  const day = formatAccessDate(user.accessUntil).slice(0, 5);
  if (state.expired) {
    return { title: `Grátis desde ${day}`, note: days === 0 ? "o Pro acabou hoje" : `o Pro acabou há ${-days} ${plural(-days, "dia", "dias")}`, tone: "muted" };
  }
  return {
    title: `Até ${formatAccessFull(user.accessUntil)}`,
    note: state.subscribed
      ? "assinatura ativa, renova sozinha"
      : days === 0 ? "vence hoje" : `${plural(days, "falta", "faltam")} ${days} ${plural(days, "dia", "dias")}`,
    tone: state.expiring ? "warn" : "default",
  };
}

/** "27/10/2026 · 01:42" no horário de Brasília. */
function formatAccessFull(value: string): string {
  const [date, time] = new Date(value)
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .split(", ");
  return `${date} · ${time}`;
}

/** "17/10" — o dia do vínculo, sem a hora. */
export const shortDay = (value: string | null) => formatSaoPaulo(value).slice(0, 5);

// ---- Filtros

export type UserTab = "all" | "active" | "problems";

export const USER_TABS: readonly { id: UserTab; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "problems", label: "Problemas" },
];

export function inTab(state: UserState, tab: UserTab): boolean {
  if (tab === "active") return state.active;
  if (tab === "problems") return state.problem;
  return true;
}

export type UserFilters = {
  role: "all" | "admin" | "user";
  account: "all" | "active" | "inactive" | "locked";
  access: "all" | "expired" | "expiring" | "none" | "subscribed";
  telegram: "all" | "yes" | "no";
  group: "all" | "in" | "out";
};

export const NO_FILTERS: UserFilters = { role: "all", account: "all", access: "all", telegram: "all", group: "all" };

type FilterGroup<K extends keyof UserFilters> = {
  key: K;
  title: string;
  options: readonly { value: UserFilters[K]; label: string }[];
};

const group = <K extends keyof UserFilters>(g: FilterGroup<K>) => g;

// A aba cobre o recorte do dia a dia; o resto fica no menu Filtros.
export const FILTER_GROUPS = [
  group({ key: "role", title: "Papel", options: [{ value: "all", label: "Todos" }, { value: "admin", label: "Admin" }, { value: "user", label: "Usuário" }] }),
  group({
    key: "account",
    title: "Conta",
    options: [{ value: "all", label: "Todas" }, { value: "active", label: "Ativa" }, { value: "inactive", label: "Inativa" }, { value: "locked", label: "Bloqueada" }],
  }),
  group({
    key: "access",
    title: "Acesso",
    options: [
      { value: "all", label: "Todos" },
      { value: "expired", label: "Grátis" },
      { value: "expiring", label: "Pro acaba em 7 dias" },
      { value: "none", label: "Sem prazo" },
      { value: "subscribed", label: "Assinante" },
    ],
  }),
  group({ key: "telegram", title: "Telegram", options: [{ value: "all", label: "Todos" }, { value: "yes", label: "Vinculado" }, { value: "no", label: "Não vinculado" }] }),
  group({ key: "group", title: "Grupo Tips", options: [{ value: "all", label: "Todos" }, { value: "in", label: "No grupo" }, { value: "out", label: "Fora do grupo" }] }),
] as const;

export function matchesFilters(user: AdminUser, state: UserState, f: UserFilters): boolean {
  const role = f.role === "all" || (f.role === "admin" ? user.roleId === 1 : user.roleId === 3);
  const account =
    f.account === "all" ||
    (f.account === "active" ? state.active && !state.locked : f.account === "inactive" ? !state.active : state.locked);
  const access =
    f.access === "all" ||
    (f.access === "expired"
      ? state.expired
      : f.access === "expiring"
        ? state.expiring
        : f.access === "none"
          ? !user.accessUntil
          : state.subscribed);
  const telegram = f.telegram === "all" || (f.telegram === "yes") === user.hasTelegram;
  const inGroup = f.group === "all" || (f.group === "in") === state.inGroup;
  return role && account && access && telegram && inGroup;
}

export const activeFilterCount = (f: UserFilters) => Object.values(f).filter((v) => v !== "all").length;

export function matchesSearch(user: AdminUser, term: string): boolean {
  if (!term) return true;
  return [user.username, user.email, user.fullName ?? ""].some((v) => v.toLowerCase().includes(term));
}

/** Faixa de alerta: "1 inativo no grupo Tips · 2 bloqueados". */
export function problemSummary(states: UserState[]): string {
  const count = (test: (s: UserState) => boolean) => states.filter(test).length;
  const stray = count((s) => s.strayInGroup);
  const locked = count((s) => s.locked);
  return [
    stray && `${stray} ${plural(stray, "inativo", "inativos")} no grupo Tips`,
    locked && `${locked} ${plural(locked, "bloqueado", "bloqueados")}`,
  ]
    .filter(Boolean)
    .join(" · ");
}
