import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionApi } from "../api/transaction.api";
import type {
  CreateTransactionPayload,
  TransactionQuery,
  UpdateTransactionPayload,
} from "../types/transaction.types";

export const transactionKeys = {
  all: (query?: TransactionQuery) => ["transactions", query] as const,
  one: (id: string) => ["transactions", id] as const,
  summary: (walletId?: string, month?: string) =>
    ["transactions", "summary", walletId, month] as const,
};

export const useTransactions = (query?: TransactionQuery) =>
  useQuery({
    queryKey: transactionKeys.all(query),
    queryFn: () => transactionApi.getAll(query),
  });

export const useTransaction = (id: string) =>
  useQuery({
    queryKey: transactionKeys.one(id),
    queryFn: () => transactionApi.getOne(id),
    enabled: !!id,
  });

export const useTransactionSummary = (walletId?: string, month?: string) =>
  useQuery({
    queryKey: transactionKeys.summary(walletId, month),
    queryFn: () => transactionApi.getSummary(walletId, month),
  });

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) =>
      transactionApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTransactionPayload;
    }) => transactionApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: transactionKeys.one(id) });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
};

export const useUserTransactions = (userId: string) =>
  useQuery({
    queryKey: ['userTransactions', userId],
    queryFn: () => transactionApi.getByUserId(userId),
    enabled: !!userId,
  });
