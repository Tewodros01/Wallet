import type { User } from "./user.types";

// ─── Agent Stats Types ────────────────────────────────────────────────────────

export interface AgentStatsTransaction {
  id: string;
  status: string;
  amount: number;
  method?: string;
  accountNumber?: string;
  reference?: string;
  createdAt: string;
  user?: User;
}

export interface AgentStatsSummary {
  totalInvited?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  totalDepositCoins?: number;
  totalWithdrawalCoins?: number;
  pendingDeposits?: number;
  pendingWithdrawals?: number;
}

export interface AgentStatsInvite {
  code: string;
  commission: number;
}

export interface AgentStatsData {
  agent?: User;
  summary?: AgentStatsSummary;
  deposits?: AgentStatsTransaction[];
  withdrawals?: AgentStatsTransaction[];
  invitedUsers?: User[];
  invite?: AgentStatsInvite;
}

export type AgentStatsTab = "overview" | "deposits" | "withdrawals" | "users";