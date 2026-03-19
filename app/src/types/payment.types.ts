import { PaymentMethod, DepositStatus, WithdrawalStatus } from "./enums";

// ─── Payment Types ────────────────────────────────────────────────────────────

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  proofUrl: string | null;
  status: DepositStatus;
  failureReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepositRequest {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  proofUrl?: string;
}

export interface UpdateDepositRequest {
  status: DepositStatus;
  failureReason?: string;
  completedAt?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  accountNumber: string;
  status: WithdrawalStatus;
  failureReason: string | null;
  processedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWithdrawalRequest {
  amount: number;
  method: PaymentMethod;
  accountNumber: string;
}

export interface UpdateWithdrawalRequest {
  status: WithdrawalStatus;
  failureReason?: string;
  processedAt?: string;
  completedAt?: string;
}

export interface PaymentSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  completedDeposits: number;
  completedWithdrawals: number;
}