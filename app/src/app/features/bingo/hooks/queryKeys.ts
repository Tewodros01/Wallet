import type { RoomQuery } from "../../../../api/rooms.api";

export const roomKeys = {
  all: (query?: RoomQuery) => ["rooms", query] as const,
  one: (id: string) => ["rooms", id] as const,
  history: () => ["rooms", "history"] as const,
  myPlayer: (id: string) => ["rooms", id, "me"] as const,
};
