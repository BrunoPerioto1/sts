// Chaves de sessão. Estavam escritas à mão em seis arquivos (interceptor do
// axios, App, login, cadastro, excluir conta).
const TOKEN_KEY = "token";
const REMEMBERED_EMAIL_KEY = "remembered_email";
const ACCESS_BLOCK_KEY = "access_block";

// Storage pode estar bloqueado (aba anônima, dado do site apagado): a sessão
// só não persiste, a tela não quebra.
function read(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function write(storage: Storage, key: string, value: string | null) {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    /* sem storage, sem persistência */
  }
}

// Token vencido conta como ausente: sem isso o RequireAuth deixava entrar numa
// URL salva e a tela abria vazia, com tudo dando 401. Só lê o `exp` — quem
// valida a assinatura é o backend.
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function getToken(): string | null {
  const token = read(localStorage, TOKEN_KEY) ?? read(sessionStorage, TOKEN_KEY);
  if (token && isExpired(token)) {
    clearToken();
    return null;
  }
  return token;
}

/**
 * "Manter conectado" marcado: localStorage (sobrevive a fechar o navegador) e
 * o backend emite um token de 30 dias. Desmarcado: sessionStorage, que some
 * com a aba — antes a caixa só lembrava o e-mail.
 */
export function saveToken(token: string, remember = true) {
  write(remember ? localStorage : sessionStorage, TOKEN_KEY, token);
  write(remember ? sessionStorage : localStorage, TOKEN_KEY, null);
  saveAccessBlock(null);
}

export function clearToken() {
  write(localStorage, TOKEN_KEY, null);
  write(sessionStorage, TOKEN_KEY, null);
}

export function getRememberedEmail(): string | null {
  return read(localStorage, REMEMBERED_EMAIL_KEY);
}

// `null` esquece o e-mail — é o "Manter conectado" desmarcado.
export function setRememberedEmail(email: string | null) {
  write(localStorage, REMEMBERED_EMAIL_KEY, email);
}

/**
 * Corpo da resposta 402 (acesso vencido ou conta nova). A tela de renovação
 * não tem sessão válida: é com o `payToken` daqui que ela pede o PIX desta
 * conta e avisa "Já paguei".
 */
export interface AccessBlock {
  status?: "new" | "expired";
  payToken?: string;
  accessUntil?: string;
}

export function saveAccessBlock(block: AccessBlock | null) {
  write(sessionStorage, ACCESS_BLOCK_KEY, block ? JSON.stringify(block) : null);
}

export function getAccessBlock(): AccessBlock | null {
  try {
    return JSON.parse(read(sessionStorage, ACCESS_BLOCK_KEY) ?? "null") as AccessBlock | null;
  } catch {
    return null;
  }
}
