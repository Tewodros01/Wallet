import type { User } from "./user.types";

// ─── Withdrawal Types ────────────────────────────────────────────────────────

export interface Agent extends User {
  phone: string | null;
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
