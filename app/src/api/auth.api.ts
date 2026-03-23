import { api } from "../lib/axios";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  TelegramLoginPayload,
  TelegramSendMessagePayload,
  TelegramStatus,
  User,
} from "../types/auth.types";

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", payload).then((r) => r.data),

  telegramLogin: (payload: TelegramLoginPayload) =>
    api.post<AuthResponse>("/auth/telegram", payload).then((r) => r.data),

  refresh: (refresh_token: string) =>
    api
      .post<AuthResponse>("/auth/refresh", { refresh_token })
      .then((r) => r.data),

  logout: (refresh_token: string) =>
    api.post("/auth/logout", { refresh_token }).then((r) => r.data),

  logoutAll: () => api.post("/auth/logout-all").then((r) => r.data),

  getProfile: () => api.get<User>("/auth/profile").then((r) => r.data),

  getTelegramStatus: () =>
    api.get<TelegramStatus>("/auth/telegram/status").then((r) => r.data),

  sendTelegramMessage: (payload: TelegramSendMessagePayload) =>
    api.post("/auth/telegram/message", payload).then((r) => r.data),

  getSessions: (currentSessionToken?: string) =>
    api
      .get("/auth/sessions", {
        headers: currentSessionToken
          ? { "x-session-token": currentSessionToken }
          : undefined,
      })
      .then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }).then((r) => r.data),

  revokeSession: (sessionId: string) =>
    api.post(`/auth/sessions/${sessionId}/revoke`).then((r) => r.data),
};
