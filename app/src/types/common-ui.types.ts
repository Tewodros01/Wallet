import type { User } from "./user.types";

// ─── Common UI Types ──────────────────────────────────────────────────────────

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export type TransferUser = Pick<
  User,
  "id" | "username" | "firstName" | "lastName" | "avatar" | "coinsBalance"
>;

export interface TransferSummaryItem {
  label: string;
  value: string;
  color: string;
}

export interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: ApiError) => void;
  onSettled?: () => void;
}
