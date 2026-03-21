import type { RoomQuery } from "../../api/rooms.api";

export const bingoKeys = {
  all: (query?: RoomQuery) => ["rooms", query] as const,
  one: (id: string) => ["rooms", id] as const,
  history: () => ["rooms", "history"] as const,
  myPlayer: (id: string) => [...bingoKeys.one(id), "my-player"] as const,
} as const;
