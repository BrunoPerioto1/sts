import { apiClient } from "../apiClient";

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
  const response = await apiClient().transactions.get<TransactionTypeDto[]>("/types");
  return response.data;
}
