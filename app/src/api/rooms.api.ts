import { api } from "../lib/axios";
import type { GameHistoryItem } from "../types/game-history.types";
import type {
  CreateGameRoomRequest,
  AvailableRoomCard,
  GameRoomDetail,
  GameRoomPlayer,
  JoinRoomResponse,
  SelectRoomCardsResponse,
} from "../types/game.types";

export type GameSpeed = "SLOW" | "NORMAL" | "FAST";
export type RoomStatus = "WAITING" | "PLAYING" | "FINISHED" | "CANCELLED";

export type CreateRoomPayload = CreateGameRoomRequest;

export interface RoomQuery {
  status?: "all" | "waiting" | "playing";
  search?: string;
  includeCancelled?: boolean;
}

export const roomsApi = {
  getMyPlayer: (id: string) =>
    api.get<GameRoomPlayer>(`/rooms/${id}/my-player`).then((r) => r.data),
  getAvailableCards: (id: string) =>
    api.get<AvailableRoomCard[]>(`/rooms/${id}/cards/available`).then((r) => r.data),
  getAll: (query?: RoomQuery) =>
    api.get<GameRoomDetail[]>("/rooms", { params: query }).then((r) => r.data),
  getOne: (id: string) => api.get<GameRoomDetail>(`/rooms/${id}`).then((r) => r.data),
  create: (payload: CreateRoomPayload) =>
    api.post<GameRoomDetail>("/rooms", payload).then((r) => r.data),
  cancel: (id: string) => api.post<GameRoomDetail>(`/rooms/${id}/cancel`).then((r) => r.data),
  finish: (id: string) => api.post<GameRoomDetail>(`/rooms/${id}/finish`).then((r) => r.data),
  remove: (id: string) => api.delete(`/rooms/${id}`).then((r) => r.data),
  join: (id: string, password?: string) =>
    api.post<JoinRoomResponse>(`/rooms/${id}/join`, { password }).then((r) => r.data),
  selectCards: (id: string, cardIds: string[]) =>
    api.post<SelectRoomCardsResponse>(`/rooms/${id}/cards/select`, { cardIds }).then((r) => r.data),
  start: (id: string) => api.post(`/rooms/${id}/start`).then((r) => r.data),
  claimBingo: (id: string, cardId?: string) =>
    api.post(`/rooms/${id}/bingo`, { cardId }).then((r) => r.data),
  getHistory: () =>
    api.get<GameHistoryItem[]>("/rooms/history").then((r) => r.data),
};
