export type Currency = "USD" | "EUR" | "GBP" | "ETB";

export interface Wallet {
  id: string;
  name: string;
  balance: string;
  currency: Currency;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletPayload {
  name: string;
  currency?: Currency;
  isDefault?: boolean;
}

export interface UpdateWalletPayload {
  name?: string;
  currency?: Currency;
  isDefault?: boolean;
}
