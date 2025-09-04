import { apiClient } from "../apiClient";

export interface TransactionFilterParams {
  startDate?: string;
  endDate?: string;
  houseId?: number;
}

export interface TransactionDto {
  id: number;
  houseId: number;
  houseName: string;
  transactionType: number;
  value: number;
  createdAt: string;
}

export async function getTransactions(params: TransactionFilterParams) {
  const response = await apiClient().transactions.get<TransactionDto[]>(
    "/transactions",
    { params }
  );
  return response.data;
}


