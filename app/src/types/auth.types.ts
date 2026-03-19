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

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
}
