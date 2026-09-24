import axios from 'axios';
import { clearToken, getToken } from '@/lib/auth-session';

export const apiClient = () => {

  const baseURL = import.meta.env.VITE_API_URL;


  const dashboard = axios.create({
    baseURL,
  });

  const bets = axios.create({
    baseURL: baseURL + 'bets/',
  });

  const houses = axios.create({
    baseURL: baseURL + 'house/',
  });

  const transactions = axios.create({
    baseURL: baseURL + 'transactions/',
  });

  const auth = axios.create({
    baseURL: baseURL + 'auth/',
  });

  const users = axios.create({
    baseURL: baseURL + 'users/',
  });

  const settlement = axios.create({
    baseURL: baseURL + 'settlement/',
  });

  const tips = axios.create({
    baseURL: baseURL + 'tips',
  });

  const admin = axios.create({
    baseURL: baseURL + 'admin/',
  });

  const attachAuthInterceptor = (instance: ReturnType<typeof axios.create>) => {
    instance.interceptors.request.use((config) => {
      // No axios v1 `config.headers` num interceptor de request é sempre
      // AxiosHeaders, então `.set` basta.
      const token = getToken();
      if (token) config.headers.set('Authorization', `Bearer ${token}`);
      return config;
    });
    // Token recusado pelo backend (secret trocado, vencido no meio da sessão):
    // volta pro login. Só o 401 do Passport ("Unauthorized"/"TokenExpiredError")
    // — "Senha atual incorreta" também é 401 e não pode derrubar a sessão.
    // 402 = acesso vencido (backend confere a cada request): leva pra tela do PIX.
    instance.interceptors.response.use(undefined, (error) => {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (
        status === 401 &&
        (message === 'Unauthorized' || message === 'TokenExpiredError') &&
        window.location.pathname !== '/login'
      ) {
        clearToken();
        window.location.href = '/login';
      } else if (status === 402 && window.location.pathname !== '/renovar') {
        window.location.href = '/renovar';
      }
      return Promise.reject(error);
    });
    return instance;
  };

  // Attach JWT to protected resources
  attachAuthInterceptor(dashboard);
  attachAuthInterceptor(bets);
  attachAuthInterceptor(houses);
  attachAuthInterceptor(transactions);
  attachAuthInterceptor(users);
  attachAuthInterceptor(auth);
  attachAuthInterceptor(settlement);
  attachAuthInterceptor(tips);
  attachAuthInterceptor(admin);


  return {
    dashboard,
    bets,
    houses,
    transactions,
    auth,
    users,
    settlement,
    tips,
    admin,
  };
};

export const api = apiClient();