import { api } from '@/api/apiClient';
import { unwrap } from '@/api/request';

export interface CreateTransactionParams {
  houseId: number;
  transactionTypeId: number;
  value: number;
  description?: string;
}

export function createTransaction(transaction: CreateTransactionParams) {
  return unwrap(api.transactions.post('new', transaction));
}


export interface TransactionTypeDto {
  id: number;
  name: string;
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
  houseId?: number;
  transactionTypeId?: number;
  description?: string | null;
  houseName: string;
  transactionType: string;
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


export interface UpdateTransactionParams {
  transactionTypeId?: number;
  /** Como digitado: o back aplica o sinal (saque negativo, depósito positivo). */
  value?: number;
  description?: string;
}

export function updateTransaction(id: number, changes: UpdateTransactionParams) {
  return unwrap(api.transactions.patch(`/${id}`, changes));
}

export function deleteTransaction(id: number) {
  return unwrap(api.transactions.delete(`/${id}`));
}
