import type { User } from "./user.types";
import type { FinancialAccount } from "./financial-account.types";

// ─── Withdrawal Types ────────────────────────────────────────────────────────

export interface Agent extends User {
  phone: string | null;
  financialAccounts?: FinancialAccount[];
}

export interface ApiAnalyticsPoint {
  date: string;
  deposits: number;
  withdrawals: number;
  newUsers: number;
}

export interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
}
