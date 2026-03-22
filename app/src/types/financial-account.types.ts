import type {
  FinancialAccountProvider,
  FinancialAccountType,
} from "./enums";

export interface FinancialAccount {
  id: string;
  type: FinancialAccountType;
  provider: FinancialAccountProvider;
  accountName: string | null;
  accountNumber: string;
  label: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialAccountPayload {
  provider: FinancialAccountProvider;
  accountNumber: string;
  accountName?: string;
  label?: string;
  isDefault?: boolean;
}

export interface UpdateFinancialAccountPayload {
  provider?: FinancialAccountProvider;
  accountNumber?: string;
  accountName?: string;
  label?: string;
  isDefault?: boolean;
}
