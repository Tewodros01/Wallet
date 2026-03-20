import type { User } from "./user.types";

export type { User };

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TelegramLoginPayload {
  initData: string;
}

export interface TelegramSendMessagePayload {
  text: string;
  parseMode?: "HTML" | "MarkdownV2";
}

export interface TelegramStatus {
  linked: boolean;
  telegramId: string | null;
  telegramUsername: string | null;
  telegramPhotoUrl: string | null;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
}
