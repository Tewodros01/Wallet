import type {
  CreateWithdrawalRequest,
  Deposit,
  Withdrawal,
} from "./payment.types";
import type {
  CreateWalletRequest,
  Transaction,
  UpdateWalletRequest,
  Wallet,
} from "./transaction.types";

// ─── Wallet Domain Type Re-Exports ───────────────────────────────────────────

export type { Transaction, Deposit, Withdrawal, Wallet };

export type CreateWalletPayload = CreateWalletRequest;
export type UpdateWalletPayload = UpdateWalletRequest;
export type CreateWithdrawalPayload = CreateWithdrawalRequest;

// ─── Wallet UI Types ─────────────────────────────────────────────────────────

export type WalletTab = "overview" | "requests";

export type ActivityKind = "tx" | "deposit" | "withdrawal";

export type WalletActivityStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED"
  | "REVERSED";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  date: string;
  amount: number;
  isIncome: boolean;
  status: WalletActivityStatus;
  icon: string;
  color: string;
}

export interface StatusBadgeProps {
  status: WalletActivityStatus;
}
