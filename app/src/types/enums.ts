// ─── Enum-like Constants ─────────────────────────────────────────────────────

const defineEnum = <T extends Record<string, string>>(values: T) => values;

export const Role = defineEnum({
  USER: "USER",
  AGENT: "AGENT",
  ADMIN: "ADMIN",
});
export type Role = (typeof Role)[keyof typeof Role];

export const Currency = defineEnum({
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  ETB: "ETB",
});
export type Currency = (typeof Currency)[keyof typeof Currency];

export const TransactionType = defineEnum({
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  TRANSFER: "TRANSFER",
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  GAME_ENTRY: "GAME_ENTRY",
  GAME_WIN: "GAME_WIN",
  AGENT_COMMISSION: "AGENT_COMMISSION",
  REFERRAL_BONUS: "REFERRAL_BONUS",
});
export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = defineEnum({
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REVERSED: "REVERSED",
});
export type TransactionStatus =
  (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const RecurrenceInterval = defineEnum({
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
});
export type RecurrenceInterval =
  (typeof RecurrenceInterval)[keyof typeof RecurrenceInterval];

export const RoomStatus = defineEnum({
  WAITING: "WAITING",
  PLAYING: "PLAYING",
  FINISHED: "FINISHED",
  CANCELLED: "CANCELLED",
});
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const GameSpeed = defineEnum({
  SLOW: "SLOW",
  NORMAL: "NORMAL",
  FAST: "FAST",
});
export type GameSpeed = (typeof GameSpeed)[keyof typeof GameSpeed];

export const PlayerStatus = defineEnum({
  JOINED: "JOINED",
  PLAYING: "PLAYING",
  WON: "WON",
  LOST: "LOST",
  LEFT: "LEFT",
});
export type PlayerStatus = (typeof PlayerStatus)[keyof typeof PlayerStatus];

export const PaymentMethod = defineEnum({
  TELEBIRR: "TELEBIRR",
  CBE_BIRR: "CBE_BIRR",
  BANK_CARD: "BANK_CARD",
});
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const DepositStatus = defineEnum({
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
});
export type DepositStatus = (typeof DepositStatus)[keyof typeof DepositStatus];

export const WithdrawalStatus = defineEnum({
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REJECTED: "REJECTED",
});
export type WithdrawalStatus =
  (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus];

export const PaymentRequestStatus = defineEnum({
  PENDING: "PENDING",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
});
export type PaymentRequestStatus =
  (typeof PaymentRequestStatus)[keyof typeof PaymentRequestStatus];

export const AgentStatus = defineEnum({
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});
export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

export const TournamentStatus = defineEnum({
  UPCOMING: "UPCOMING",
  LIVE: "LIVE",
  FINISHED: "FINISHED",
  CANCELLED: "CANCELLED",
});
export type TournamentStatus =
  (typeof TournamentStatus)[keyof typeof TournamentStatus];

export const MissionType = defineEnum({
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
});
export type MissionType = (typeof MissionType)[keyof typeof MissionType];

export const MissionCategory = defineEnum({
  PLAY_GAMES: "PLAY_GAMES",
  WIN_GAMES: "WIN_GAMES",
  DEPOSIT: "DEPOSIT",
  INVITE: "INVITE",
  TOURNAMENT: "TOURNAMENT",
  KENO: "KENO",
});
export type MissionCategory =
  (typeof MissionCategory)[keyof typeof MissionCategory];

export const NotificationType = defineEnum({
  WIN: "WIN",
  DEPOSIT: "DEPOSIT",
  INVITE: "INVITE",
  TOURNAMENT: "TOURNAMENT",
  SYSTEM: "SYSTEM",
  MISSION: "MISSION",
  WITHDRAWAL: "WITHDRAWAL",
  TRANSFER: "TRANSFER",
});
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];
