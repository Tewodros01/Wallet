// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Role {
  USER = "USER",
  AGENT = "AGENT",
  ADMIN = "ADMIN",
}

export enum Currency {
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
  ETB = "ETB",
}

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  GAME_ENTRY = "GAME_ENTRY",
  GAME_WIN = "GAME_WIN",
  AGENT_COMMISSION = "AGENT_COMMISSION",
  REFERRAL_BONUS = "REFERRAL_BONUS",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REVERSED = "REVERSED",
}

export enum RecurrenceInterval {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export enum RoomStatus {
  WAITING = "WAITING",
  PLAYING = "PLAYING",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}

export enum GameSpeed {
  SLOW = "SLOW",
  NORMAL = "NORMAL",
  FAST = "FAST",
}

export enum PlayerStatus {
  JOINED = "JOINED",
  PLAYING = "PLAYING",
  WON = "WON",
  LOST = "LOST",
  LEFT = "LEFT",
}

export enum PaymentMethod {
  TELEBIRR = "TELEBIRR",
  CBE_BIRR = "CBE_BIRR",
  BANK_CARD = "BANK_CARD",
}

export enum DepositStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum WithdrawalStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REJECTED = "REJECTED",
}

export enum AgentStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum TournamentStatus {
  UPCOMING = "UPCOMING",
  LIVE = "LIVE",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}

export enum MissionType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
}

export enum MissionCategory {
  PLAY_GAMES = "PLAY_GAMES",
  WIN_GAMES = "WIN_GAMES",
  DEPOSIT = "DEPOSIT",
  INVITE = "INVITE",
  TOURNAMENT = "TOURNAMENT",
  KENO = "KENO",
}

export enum NotificationType {
  WIN = "WIN",
  DEPOSIT = "DEPOSIT",
  INVITE = "INVITE",
  TOURNAMENT = "TOURNAMENT",
  SYSTEM = "SYSTEM",
  MISSION = "MISSION",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER = "TRANSFER",
}