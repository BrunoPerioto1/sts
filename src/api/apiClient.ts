import axios from 'axios';

export const apiClient = () => {
  const baseURL = 'https://vtsbackend.vercel.app/';

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


  return {
    dashboard,
    bets,
    houses,
    transactions,
  };
};

export const api = apiClient();