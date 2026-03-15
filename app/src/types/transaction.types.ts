export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
export type RecurrenceInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface Transaction {
  id: string;
  title: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  note: string | null;
  date: string;
  isRecurring: boolean;
  recurrenceInterval: RecurrenceInterval | null;
  recurrenceEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  wallet: { id: string; name: string; currency: string };
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  sourceWallet: { id: string; name: string; currency: string } | null;
  destinationWallet: { id: string; name: string; currency: string } | null;
  parentTransactionId: string | null;
}

export interface TransactionSummary {
  period: { start: string; end: string };
  totalIncome: number;
  totalExpense: number;
  totalTransfer: number;
  netBalance: number;
  transactionCount: number;
}

export interface PaginatedTransactions {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreateTransactionPayload {
  title: string;
  amount: number;
  type: TransactionType;
  status?: TransactionStatus;
  note?: string;
  date: string;
  walletId: string;
  categoryId?: string;
  sourceWalletId?: string;
  destinationWalletId?: string;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval;
  recurrenceEndsAt?: string;
}

export interface UpdateTransactionPayload {
  title?: string;
  amount?: number;
  status?: TransactionStatus;
  note?: string;
  date?: string;
  categoryId?: string;
  isRecurring?: boolean;
}

export interface TransactionQuery {
  page?: number;
  limit?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  categoryId?: string;
  walletId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: "date" | "amount" | "createdAt";
  sortOrder?: "asc" | "desc";
}
