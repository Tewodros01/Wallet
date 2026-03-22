import { Role } from "./enums";

// ─── User Types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional for frontend, never sent from API
  firstName: string;
  lastName: string;
  phone: string | null;
  telebirrAccount?: string | null;
  cbeBirrAccount?: string | null;
  boaAccountNumber?: string | null;
  avatar: string | null;
  bio: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  telegramPhotoUrl?: string | null;
  role: Role;
  isVerified: boolean;
  onboardingDone: boolean;
  coinsBalance: number;
  referredById: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  referralCode?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  telebirrAccount?: string;
  cbeBirrAccount?: string;
  boaAccountNumber?: string;
  avatar?: string;
  bio?: string;
}

export interface UserStats {
  totalGames: number;
  wins: number;
  winRate: number;
  totalEarned: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  createdAt: string;
}
