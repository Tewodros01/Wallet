import {
  DepositStatus,
  PaymentMethod,
  WithdrawalStatus,
} from "./enums";
import type { User } from "./user.types";

// ─── Payment Types ────────────────────────────────────────────────────────────

export interface Deposit {
  id: string;
  userId: string;
  agentId: string | null;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  proofUrl: string | null;
  status: DepositStatus;
  failureReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  agent?: User | null;
}

export interface CreateDepositRequest {
  amount: number;
  method: PaymentMethod;
  agentId: string;
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
  agentId: string | null;
  amount: number;
  feeAmount: number;
  payoutAmount: number;
  method: PaymentMethod;
  accountNumber: string;
  status: WithdrawalStatus;
  failureReason: string | null;
  processedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  agent?: User | null;
}

export interface CreateWithdrawalRequest {
  amount: number;
  method: PaymentMethod;
  agentId: string;
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
