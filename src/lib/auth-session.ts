// Chaves de sessão no localStorage. Estavam escritas à mão em seis arquivos
// (interceptor do axios, App, login, cadastro, excluir conta).
const TOKEN_KEY = "token";
const REMEMBERED_EMAIL_KEY = "remembered_email";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
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
