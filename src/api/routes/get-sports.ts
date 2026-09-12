import { api } from '../apiClient';

export interface SportDto {
  id: number;
  name: string;
  /** Variações que o parser devolve e que classificam a aposta/tip. */
  aliases: string[];
  active?: boolean;
}

// GET /sports
export async function getSports() {
  const response = await api.sports.get<SportDto[]>('');
  return response.data;
}
