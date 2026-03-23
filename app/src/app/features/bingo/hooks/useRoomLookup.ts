import { useCallback } from "react";
import { roomsApi } from "../../../../api/rooms.api";
import type { GameRoomDetail } from "../../../../types/game.types";

export function useRoomLookup(roomsData: GameRoomDetail[]) {
  const normalizeLookupValue = useCallback(
    (value: string) => value.trim().toUpperCase(),
    [],
  );

  const matchRoomLookup = useCallback(
    (room: GameRoomDetail, value: string) => {
      const normalized = normalizeLookupValue(value);
      return (
        room.id.toUpperCase() === normalized ||
        room.id.slice(-8).toUpperCase() === normalized
      );
    },
    [normalizeLookupValue],
  );

  const resolveRoom = useCallback(
    async (value: string) => {
      const normalized = value.trim();
      if (!normalized) return null;

      const localRoom = roomsData.find((room) =>
        matchRoomLookup(room, normalized),
      );
      if (localRoom) return localRoom;

      try {
        return await roomsApi.getOne(normalized);
      } catch {
        const matchingRooms = await roomsApi.getAll({ search: normalized });
        return (
          matchingRooms.find((room) => matchRoomLookup(room, normalized)) ?? null
        );
      }
    },
    [matchRoomLookup, roomsData],
  );

  return { resolveRoom };
}
