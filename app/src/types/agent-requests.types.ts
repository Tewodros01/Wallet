import type { User } from "./user.types";

// ─── Agent Request Types ─────────────────────────────────────────────────────

export interface AgentDepositRequest {
  id: string;
  userId: string;
  agentId?: string | null;
  amount: number;
  method: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "PROCESSING";
  proofUrl?: string;
  createdAt: string;
  user?: User;
  agent?: User;
}

export interface AgentWithdrawalRequest {
  id: string;
  userId: string;
  agentId?: string | null;
  amount: number;
  feeAmount?: number;
  payoutAmount?: number;
  method: string;
  accountNumber: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "PROCESSING";
  createdAt: string;
  user?: User;
  agent?: User;
}

export interface AgentRequests {
  deposits: AgentDepositRequest[];
  withdrawals: AgentWithdrawalRequest[];
}

export interface AgentStats {
  commission: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingRequests: number;
}
