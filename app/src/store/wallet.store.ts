import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../config/routes";

interface WalletState {
  balance: number;
  setBalance: (balance: number) => void;
  syncFromUser: (coinsBalance: number) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      balance: 0,
      setBalance: (balance) => set({ balance }),
      syncFromUser: (coinsBalance) => set({ balance: coinsBalance }),
    }),
    { name: STORAGE_KEYS.wallet },
  ),
);
