import { api } from '@/api/apiClient';

export interface CreateTransactionParams {
  houseId: number;
  transactionTypeId: number;
  value: number;
}

export async function createTransaction({
  houseId,
  transactionTypeId,
  value
}: CreateTransactionParams) {
  try {
    return await api.transactions.post('', {
      houseId,
      transactionTypeId,
      value
    });
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}