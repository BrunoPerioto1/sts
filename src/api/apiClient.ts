import axios from 'axios';

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

  const attachAuthInterceptor = (instance: ReturnType<typeof axios.create>) => {
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        // Axios v1: headers can be AxiosHeaders (with set) or a plain object
        const headers: any = config.headers;
        if (headers && typeof (headers as any).set === 'function') {
          (headers as any).set('Authorization', `Bearer ${token}`);
        } else {
          config.headers = { ...(headers || {}), Authorization: `Bearer ${token}` } as any;
        }
      }
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


  return {
    dashboard,
    bets,
    houses,
    transactions,
    auth,
    users,
  };
};

export const api = apiClient();