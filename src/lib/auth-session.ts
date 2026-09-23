// Chaves de sessão no localStorage. Estavam escritas à mão em seis arquivos
// (interceptor do axios, App, login, cadastro, excluir conta).
const TOKEN_KEY = "token";
const REMEMBERED_EMAIL_KEY = "remembered_email";

// Token vencido (o JWT dura 1d) conta como ausente: sem isso o RequireAuth
// deixava entrar numa URL salva e a tela abria vazia, com tudo dando 401.
// Só lê o `exp` — quem valida a assinatura é o backend.
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && isExpired(token)) {
    clearToken();
    return null;
  }
  return token;
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getRememberedEmail(): string | null {
  return localStorage.getItem(REMEMBERED_EMAIL_KEY);
}

// `null` esquece o e-mail — é o "Manter conectado" desmarcado.
export function setRememberedEmail(email: string | null) {
  if (email) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}
