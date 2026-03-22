import type { User } from "./user.types";

// ─── Admin Panel Types ────────────────────────────────────────────────────────

export interface AdminDeposit {
  id: string;
  status: string;
  amount: number;
  agentId?: string | null;
  method?: string | null;
  reference?: string | null;
  proofUrl?: string | null;
  createdAt: string;
  user?: User;
  agent?: User;
}

export interface AdminWithdrawal {
  id: string;
  status: string;
  amount: number;
  agentId?: string | null;
  feeAmount?: number;
  payoutAmount?: number;
  method?: string | null;
  accountNumber?: string | null;
  createdAt: string;
  user?: User;
  agent?: User;
}

export interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  totalAdmins: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalDepositCoins: number;
  totalWithdrawalCoins: number;
  netFlow: number;
}

export interface AdminStatCard {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  from: string;
  to: string;
  glow: string;
}

export interface AdminQuickAction {
  label: string;
  sub: string;
  icon: React.ReactNode;
  bg: string;
  path: string;
  badge?: number;
}

export interface AdminUserBreakdown {
  label: string;
  count: number;
  bar: string;
  pct: number;
}
