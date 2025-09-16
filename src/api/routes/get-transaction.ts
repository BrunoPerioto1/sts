import { apiClient } from "../apiClient";

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
  const response = await apiClient().transactions.get<TransactionDto[]>(
    "all",
    { params }
  );
  return response.data;
}


