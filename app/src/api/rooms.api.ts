import { api } from "../lib/axios";

export type GameSpeed = "SLOW" | "NORMAL" | "FAST";
export type RoomStatus = "WAITING" | "PLAYING" | "FINISHED" | "CANCELLED";

export interface CreateRoomPayload {
  name: string;
  speed?: GameSpeed;
  entryFee?: number;
  maxPlayers?: number;
  cardsPerPlayer?: number;
  isPrivate?: boolean;
  password?: string;
}

export interface RoomQuery {
  status?: "all" | "waiting" | "playing";
  search?: string;
}

export const roomsApi = {
  getMyPlayer: (id: string) => api.get(`/rooms/${id}/my-player`).then((r) => r.data),
  getAll: (query?: RoomQuery) =>
    api.get("/rooms", { params: query }).then((r) => r.data),
  getOne: (id: string) => api.get(`/rooms/${id}`).then((r) => r.data),
  create: (payload: CreateRoomPayload) =>
    api.post("/rooms", payload).then((r) => r.data),
  join: (id: string, password?: string) =>
    api.post(`/rooms/${id}/join`, { password }).then((r) => r.data),
  start: (id: string) => api.post(`/rooms/${id}/start`).then((r) => r.data),
  claimBingo: (id: string) =>
    api.post(`/rooms/${id}/bingo`).then((r) => r.data),
  getHistory: () => api.get("/rooms/history").then((r) => r.data),
};
