import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { walletApi } from "../api/wallet.api";
import type {
  CreateWalletPayload,
  UpdateWalletPayload,
} from "../types/wallet.types";

export const walletKeys = {
  all: ["wallets"] as const,
  one: (id: string) => ["wallets", id] as const,
};

export const useWallets = () =>
  useQuery({
    queryKey: walletKeys.all,
    queryFn: walletApi.getAll,
  });

export const useWallet = (id: string) =>
  useQuery({
    queryKey: walletKeys.one(id),
    queryFn: () => walletApi.getOne(id),
    enabled: !!id,
  });

export const useCreateWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWalletPayload) => walletApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  });
};

export const useUpdateWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateWalletPayload;
    }) => walletApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      queryClient.invalidateQueries({ queryKey: walletKeys.one(id) });
    },
  });
};

export const useDeleteWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  });
};
