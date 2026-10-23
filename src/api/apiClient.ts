import axios, { type AxiosRequestConfig } from 'axios';
import { clearToken, getToken } from '@/lib/auth-session';

/**
 * Uma instância só do axios, com os interceptors registrados uma vez. Antes
 * eram nove (uma por recurso, cada uma com o mesmo interceptor copiado) — e o
 * `apiClient()` recriava as nove a cada chamada.
 */
const http = axios.create({ baseURL: import.meta.env.VITE_API_URL });

http.interceptors.request.use((config) => {
  // No axios v1 `config.headers` num interceptor de request é sempre
  // AxiosHeaders, então `.set` basta.
  const token = getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

// Token recusado pelo backend (secret trocado, vencido no meio da sessão):
// volta pro login. Só o 401 do Passport ("Unauthorized"/"TokenExpiredError")
// — "Senha atual incorreta" também é 401 e não pode derrubar a sessão.
// Vencer o Pro não tranca mais a conta (cai no Grátis): o 403 de recurso do
// Pro (code PRO_REQUIRED / AI_DAILY_LIMIT) fica com quem chamou.
http.interceptors.response.use(undefined, (error) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;
  if (
    status === 401 &&
    (message === 'Unauthorized' || message === 'TokenExpiredError') &&
    window.location.pathname !== '/login'
  ) {
    clearToken();
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

// Mesma regra do axios pra juntar base e caminho: "bets/" + "/sports" vira
// "bets/sports", e caminho vazio fica só o prefixo.
function join(prefix: string, url?: string): string {
  if (!url) return prefix;
  return `${prefix.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
}

// `any` como padrão, igual ao axios: as rotas tipam a resposta no ponto de uso.
/* eslint-disable @typescript-eslint/no-explicit-any */
function scoped(prefix: string) {
  return {
    get: <T = any>(url?: string, config?: AxiosRequestConfig) => http.get<T>(join(prefix, url), config),
    delete: <T = any>(url?: string, config?: AxiosRequestConfig) => http.delete<T>(join(prefix, url), config),
    post: <T = any>(url?: string, data?: unknown, config?: AxiosRequestConfig) =>
      http.post<T>(join(prefix, url), data, config),
    put: <T = any>(url?: string, data?: unknown, config?: AxiosRequestConfig) =>
      http.put<T>(join(prefix, url), data, config),
    patch: <T = any>(url?: string, data?: unknown, config?: AxiosRequestConfig) =>
      http.patch<T>(join(prefix, url), data, config),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const api = {
  dashboard: scoped(''),
  bets: scoped('bets/'),
  houses: scoped('house/'),
  transactions: scoped('transactions/'),
  auth: scoped('auth/'),
  users: scoped('users/'),
  settlement: scoped('settlement/'),
  tips: scoped('tips'),
  admin: scoped('admin/'),
};

// Nome antigo, ainda usado por várias rotas: devolve a mesma instância.
export const apiClient = () => api;
