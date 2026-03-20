import { Currency, TransactionType, TransactionStatus, RecurrenceInterval } from "./enums";

// ─── Transaction Types ────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  title: string;
  amount: string; // Decimal as string from API
  type: TransactionType;
  status: TransactionStatus;
  note: string | null;
  date: string;
  userId: string;
  walletId: string;
  categoryId: string | null;
  sourceWalletId: string | null;
  destinationWalletId: string | null;
  isRecurring: boolean;
  recurrenceInterval: RecurrenceInterval | null;
  recurrenceEndsAt: string | null;
  parentTransactionId: string | null;
  gameRoomId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  title: string;
  amount: number;
  type: TransactionType;
  note?: string;
  categoryId?: string;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval;
  recurrenceEndsAt?: string;
}

export interface UpdateTransactionRequest {
  title?: string;
  amount?: number;
  note?: string;
  categoryId?: string;
}

export type CreateTransactionPayload = CreateTransactionRequest;
export type UpdateTransactionPayload = UpdateTransactionRequest;

export interface TransactionQuery {
  page?: number;
  limit?: number;
  walletId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  count: number;
}

// ─── Wallet Types ─────────────────────────────────────────────────────────────

export interface Wallet {
  id: string;
  name: string;
  balance: string; // Decimal as string from API
  currency: Currency;
  userId: string;
  isDefault: boolean;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletRequest {
  name: string;
  currency?: Currency;
  isDefault?: boolean;
}

export interface UpdateWalletRequest {
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

// ─── Category Types ───────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: TransactionType;
  isSystem: boolean;
  userId: string | null;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  type: TransactionType;
}
