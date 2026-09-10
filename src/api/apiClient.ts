import axios from 'axios';
import { getToken } from '@/lib/auth-session';

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

  const tips = axios.create({
    baseURL: baseURL + 'tips',
  });

  const attachAuthInterceptor = (instance: ReturnType<typeof axios.create>) => {
    instance.interceptors.request.use((config) => {
      // No axios v1 `config.headers` num interceptor de request é sempre
      // AxiosHeaders, então `.set` basta.
      const token = getToken();
      if (token) config.headers.set('Authorization', `Bearer ${token}`);
      return config;
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
  attachAuthInterceptor(tips);


  return {
    dashboard,
    bets,
    houses,
    transactions,
    auth,
    users,
    tips,
  };
};

export const api = apiClient();