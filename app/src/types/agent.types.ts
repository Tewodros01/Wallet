import { AgentStatus } from "./enums";
import type { Deposit, Withdrawal } from "./payment.types";
import type { User } from "./user.types";

// ─── Agent Types ──────────────────────────────────────────────────────────────

export interface AgentInvite {
  id: string;
  inviterId: string;
  code: string;
  status: AgentStatus;
  commission: number;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateAgentInviteRequest {
  expiresAt?: string;
}

export interface UpdateAgentInviteRequest {
  status: AgentStatus;
  commission?: number;
}

export interface AgentStats {
  totalInvited: number;
  activeUsers: number;
  totalCommission: number;
  monthlyCommission: number;
  conversionRate: number;
}

export interface AgentSummary {
  agent: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    coinsBalance: number;
    createdAt: string;
  };
  invite: AgentInvite | null;
  summary: {
    totalInvited: number;
    totalDeposits: number;
    totalWithdrawals: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
    totalDepositCoins: number;
    totalWithdrawalCoins: number;
  };
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  invitedUsers: User[];
}
