// ─── Export All Types ────────────────────────────────────────────────────────

// Enums
export * from "./enums";

// Core Types
export * from "./admin.types";
export * from "./agent.types";
export * from "./agent-stats.types";
export * from "./bingo.types";
export * from "./common-ui.types";
export * from "./dashboard.types";
export * from "./game.types";
export * from "./mission.types";
export * from "./payment.types";
export * from "./transaction.types";
export * from "./tournament.types";
export * from "./user.types";
export * from "./wallet.types";

// Utility Types
export * from "./common.types";

// ─── Type Guards ─────────────────────────────────────────────────────────────

import { Role, TransactionStatus, TransactionType } from "./enums";
import type { Transaction } from "./transaction.types";
import type { User } from "./user.types";
import type { AgentStatsTransaction } from "./agent-stats.types";
import type { AdminDeposit, AdminWithdrawal, AdminStatCard, AdminQuickAction, AdminUserBreakdown } from "./admin.types";
import type { GameRoom, LeaderboardEntry } from "./dashboard.types";
import type { ApiError, TransferUser } from "./common-ui.types";

export const isUser = (obj: unknown): obj is User => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    typeof obj.id === "string" &&
    "username" in obj &&
    typeof obj.username === "string"
  );
};

export const isTransaction = (obj: unknown): obj is Transaction => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    typeof obj.id === "string" &&
    "amount" in obj &&
    typeof obj.amount === "string"
  );
};

export const isValidRole = (role: string): role is Role => {
  return Object.values(Role).includes(role as Role);
};

export const isValidTransactionType = (
  type: string,
): type is TransactionType => {
  return Object.values(TransactionType).includes(type as TransactionType);
};

export const isValidTransactionStatus = (
  status: string,
): status is TransactionStatus => {
  return Object.values(TransactionStatus).includes(status as TransactionStatus);
};

// ─── Utility Functions ───────────────────────────────────────────────────────

export const formatCurrency = (
  amount: string | number,
  currency = "ETB",
): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatCoins = (amount: string | number): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toLocaleString();
};

export const getTransactionSign = (type: TransactionType): "+" | "-" => {
  const positiveTypes = [
    TransactionType.INCOME,
    TransactionType.DEPOSIT,
    TransactionType.GAME_WIN,
    TransactionType.AGENT_COMMISSION,
    TransactionType.REFERRAL_BONUS,
  ];
  return positiveTypes.includes(type) ? "+" : "-";
};

export const getTransactionColor = (type: TransactionType): string => {
  const positiveTypes = [
    TransactionType.INCOME,
    TransactionType.DEPOSIT,
    TransactionType.GAME_WIN,
    TransactionType.AGENT_COMMISSION,
    TransactionType.REFERRAL_BONUS,
  ];
  return positiveTypes.includes(type) ? "text-emerald-400" : "text-rose-400";
};
