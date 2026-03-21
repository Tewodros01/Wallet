import {
  DepositStatus,
  PaymentMethod,
  PaymentRequestStatus,
  WithdrawalStatus,
} from "./enums";

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

export interface PaymentRequestParty {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface PaymentRequest {
  id: string;
  creatorId: string;
  payerId: string | null;
  amount: number;
  fee: number;
  status: PaymentRequestStatus;
  merchantLabel: string | null;
  note: string | null;
  reference: string;
  expiresAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: PaymentRequestParty;
  payer: PaymentRequestParty | null;
}

export interface CreatePaymentRequestPayload {
  amount: number;
  merchantLabel?: string;
  note?: string;
  expiresAt?: string;
}
