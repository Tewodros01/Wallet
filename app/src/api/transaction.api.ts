import { api } from "../lib/axios";
import type {
  CreateTransactionPayload,
  PaginatedTransactions,
  Transaction,
  TransactionQuery,
  TransactionSummary,
  UpdateTransactionPayload,
} from "../types/transaction.types";

export const transactionApi = {
  getAll: (query?: TransactionQuery) =>
    api
      .get<PaginatedTransactions>("/transactions", { params: query })
      .then((r) => r.data),

  getOne: (id: string) =>
    api.get<Transaction>(`/transactions/${id}`).then((r) => r.data),

  getSummary: (walletId?: string, month?: string) =>
    api
      .get<TransactionSummary>("/transactions/summary", {
        params: { walletId, month },
      })
      .then((r) => r.data),

  create: (payload: CreateTransactionPayload) =>
    api.post<Transaction>("/transactions", payload).then((r) => r.data),

  update: (id: string, payload: UpdateTransactionPayload) =>
    api.put<Transaction>(`/transactions/${id}`, payload).then((r) => r.data),

  getByUserId: (userId: string) =>
    api.get<Transaction[]>(`/transactions/user/${userId}`).then((r) => r.data),

  remove: (id: string) => api.delete(`/transactions/${id}`).then((r) => r.data),
};
