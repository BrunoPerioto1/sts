import { api } from '@/api/apiClient';

export interface CreateTransactionParams {
  houseId: number;
  transactionTypeId: number;
  value: number;
}

export async function createTransaction(transaction: CreateTransactionParams) {
  try {
    const response = await api.transactions.post('new', transaction);
    return response.data;
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



export interface TransactionFilterParams {
  startDate?: string;
  endDate?: string;
  houseId?: number;
}

export interface TransactionDto {
  id: number;
  houseName: string;
  transactionType: number;
  value: number;
  createdAt: string;
}

export async function getTransactions(params: TransactionFilterParams) {
  const response = await api.transactions.get<TransactionDto[]>(
    "all",
    { params }
  );
  return response.data;
}

