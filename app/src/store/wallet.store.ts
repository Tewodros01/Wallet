import { create } from "zustand";
import { persist } from "zustand/middleware";

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
    { name: "wallet" },
  ),
);
