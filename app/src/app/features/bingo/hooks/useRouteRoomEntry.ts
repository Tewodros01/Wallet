import { useEffect, useRef } from "react";
import type { GameRoomDetail, GameRoomPlayer } from "../../../../types/game.types";
import { RoomStatus } from "../../../../types/enums";
import { getErrorMessage } from "../../../../lib/errors";

type UseRouteRoomEntryParams = {
  roomEntryId: string;
  userId?: string;
  activeRoomId?: string | null;
  payRoomId?: string | null;
  entryError: string | null;
  resolveRoom: (value: string) => Promise<GameRoomDetail | null>;
  setEntryError: (value: string | null) => void;
  setPayRoom: (room: GameRoomDetail) => void;
  handleRejoin: (room: GameRoomDetail) => Promise<void>;
  handleSpectate: (room: GameRoomDetail) => void;
  seedRoom: (room: GameRoomDetail) => void;
};

export function useRouteRoomEntry({
  roomEntryId,
  userId,
  activeRoomId,
  payRoomId,
  entryError,
  resolveRoom,
  setEntryError,
  setPayRoom,
  handleRejoin,
  handleSpectate,
  seedRoom,
}: UseRouteRoomEntryParams) {
  const handledRouteRoomId = useRef<string | null>(null);
  const routeEntryInFlight = useRef<string | null>(null);

  useEffect(() => {
    if (!roomEntryId) return;
    if (activeRoomId === roomEntryId || payRoomId === roomEntryId) {
      handledRouteRoomId.current = roomEntryId;
      return;
    }
    if (routeEntryInFlight.current === roomEntryId) return;
    if (handledRouteRoomId.current === roomEntryId && entryError) return;

    let isCancelled = false;

    const enterFromRoute = async () => {
      routeEntryInFlight.current = roomEntryId;
      setEntryError(null);

      try {
        const room = await resolveRoom(roomEntryId);
        if (isCancelled) return;

        if (!room) {
          handledRouteRoomId.current = roomEntryId;
          setEntryError("This room link is invalid or the room no longer exists.");
          return;
        }

        const isJoined =
          room.players?.some(
            (player: GameRoomPlayer) => player.user?.id === userId,
          ) ?? false;

        if (isJoined) {
          handledRouteRoomId.current = roomEntryId;
          await handleRejoin(room);
          return;
        }

        seedRoom(room);

        if (room.status === RoomStatus.WAITING) {
          handledRouteRoomId.current = roomEntryId;
          setPayRoom(room);
          return;
        }

        if (room.status === RoomStatus.PLAYING && !room.isPrivate) {
          handledRouteRoomId.current = roomEntryId;
          handleSpectate(room);
          return;
        }

        handledRouteRoomId.current = roomEntryId;
        setEntryError(
          room.isPrivate
            ? "This private room is not available unless you have already joined it."
            : "This room is no longer available to join.",
        );
      } catch (error) {
        if (!isCancelled) {
          setEntryError(getErrorMessage(error, "Failed to open this room"));
        }
      } finally {
        if (routeEntryInFlight.current === roomEntryId) {
          routeEntryInFlight.current = null;
        }
      }
    };

    void enterFromRoute();

    return () => {
      isCancelled = true;
    };
  }, [
    roomEntryId,
    userId,
    activeRoomId,
    payRoomId,
    entryError,
    resolveRoom,
    setEntryError,
    setPayRoom,
    handleRejoin,
    handleSpectate,
    seedRoom,
  ]);
}
