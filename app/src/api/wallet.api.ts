import { api } from "../lib/axios";
import type {
  CreateWalletPayload,
  UpdateWalletPayload,
  Wallet,
} from "../types/wallet.types";

export const walletApi = {
  getAll: () => api.get<Wallet[]>("/wallets").then((r) => r.data),

  getOne: (id: string) => api.get<Wallet>(`/wallets/${id}`).then((r) => r.data),

  create: (payload: CreateWalletPayload) =>
    api.post<Wallet>("/wallets", payload).then((r) => r.data),

  update: (id: string, payload: UpdateWalletPayload) =>
    api.patch<Wallet>(`/wallets/${id}`, payload).then((r) => r.data),

  remove: (id: string) => api.delete(`/wallets/${id}`).then((r) => r.data),
};
