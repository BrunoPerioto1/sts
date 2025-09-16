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
    return await api.transactions.post('new', {
      houseId,
      transactionTypeId,
      value
    });
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}

export interface TransactionTypeDto {
  id: number;
  name: string;
}

export enum TransactionTypeEnum {
  DEPOSIT = 1,
  WITHDRAWAL = 2,
  ADJUSTMENT = 3,
}


export async function getTransactionTypes(): Promise<TransactionTypeDto[]> {
  const response = await api.transactions.get<TransactionTypeDto[]>("/types");
  return response.data;
}

