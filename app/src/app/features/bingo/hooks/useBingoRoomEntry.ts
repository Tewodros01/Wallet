import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { roomsApi } from "../../../../api/rooms.api";
import { roomKeys, useRooms } from "../../../../hooks/useRooms";
import { getErrorMessage } from "../../../../lib/errors";
import { RoomStatus } from "../../../../types/enums";
import type { GameRoomDetail, PlayerCard } from "../../../../types/game.types";
import { useRoomLookup } from "./useRoomLookup";
import { useRouteRoomEntry } from "./useRouteRoomEntry";

type Filter = "all" | "waiting" | "playing";
type Screen = "lobby" | "card-select" | "game";

type UseBingoRoomEntryParams = {
  roomEntryId: string;
  userId?: string;
  onNeedCardSelection: (
    room: GameRoomDetail,
    maxCount: number,
  ) => Promise<void>;
};

export function useBingoRoomEntry({
  roomEntryId,
  userId,
  onNeedCardSelection,
}: UseBingoRoomEntryParams) {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [payRoom, setPayRoom] = useState<GameRoomDetail | null>(null);
  const [code, setCode] = useState("");
  const [activeRoom, setActiveRoom] = useState<GameRoomDetail | null>(null);
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [rejoining, setRejoining] = useState<string | null>(null);
  const [roomCount, setRoomCount] = useState(0);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const roomsQuery = {
    status: filter === "all" ? undefined : filter,
    search: search || undefined,
  } as const;
  const { data: roomsData = [], isLoading } = useRooms(roomsQuery);
  const qc = useQueryClient();

  const seedRoom = useCallback(
    (room: GameRoomDetail) => qc.setQueryData(roomKeys.one(room.id), room),
    [qc],
  );
  const { resolveRoom } = useRoomLookup(roomsData);

  const openGameWithCards = useCallback((cards: PlayerCard[]) => {
    setPlayerCards(cards);
    setSelectedCardId(cards[0]?.id ?? null);
    setScreen("game");
  }, []);

  const handleSpectate = useCallback((room: GameRoomDetail) => {
    setEntryError(null);
    seedRoom(room);
    setActiveRoom(room);
    setIsSpectator(true);
    setPlayerCards([]);
    setSelectedCardId(null);
    setRoomCount(room._count?.players ?? room.players?.length ?? 0);
    setScreen("game");
  }, [seedRoom]);

  const openRoomFromLookup = useCallback(async (room: GameRoomDetail) => {
    if (room.status === RoomStatus.PLAYING && !room.isPrivate) {
      handleSpectate(room);
      return;
    }

    if (room.status !== RoomStatus.WAITING) {
      setEntryError("That room is not open for new players right now.");
      return;
    }

    setPayRoom(room);
  }, [handleSpectate]);

  const handleRejoin = useCallback(async (room: GameRoomDetail) => {
    setEntryError(null);
    setRejoining(room.id);
    try {
      const player = await roomsApi.getMyPlayer(room.id);
      seedRoom(room);
      setActiveRoom(room);
      setIsSpectator(false);
      setPlayerCards(player.cards ?? []);
      setSelectedCardId(player.cards?.[0]?.id ?? null);
      setRoomCount(room._count?.players ?? room.players?.length ?? 0);
      if ((player.cards?.length ?? 0) > 0) {
        setScreen("game");
      } else {
        try {
          await onNeedCardSelection(room, room.cardsPerPlayer);
          setScreen("card-select");
        } catch (selectionError) {
          setEntryError(
            getErrorMessage(
              selectionError,
              "You joined the room, but we could not load card selection.",
            ),
          );
          setScreen("lobby");
        }
      }
    } catch (error) {
      const message = getErrorMessage(error, "Unable to enter this room");
      if (room.status === "WAITING") {
        setPayRoom(room);
        setEntryError(message);
        setScreen("lobby");
      } else if (room.status === "PLAYING" && !room.isPrivate) {
        handleSpectate(room);
      } else {
        setEntryError(message);
        setScreen("lobby");
      }
    } finally {
      setRejoining(null);
    }
  }, [onNeedCardSelection, seedRoom]);

  const handleCreatedRoomEntry = useCallback(async (room: GameRoomDetail) => {
    seedRoom(room);
    setActiveRoom(room);
    setIsSpectator(false);
    setRoomCount(room._count?.players ?? room.players?.length ?? 1);
    try {
      const player = await roomsApi.getMyPlayer(room.id);
      setPlayerCards(player.cards ?? []);
      setSelectedCardId(player.cards?.[0]?.id ?? null);
      if ((player.cards?.length ?? 0) > 0) {
        setScreen("game");
      } else {
        try {
          await onNeedCardSelection(room, room.cardsPerPlayer);
          setScreen("card-select");
        } catch (selectionError) {
          setEntryError(
            getErrorMessage(
              selectionError,
              "Room created, but we could not load card selection yet.",
            ),
          );
          setScreen("lobby");
        }
      }
    } catch {
      setPlayerCards([]);
      setSelectedCardId(null);
      try {
        await onNeedCardSelection(room, room.cardsPerPlayer);
        setScreen("card-select");
      } catch (selectionError) {
        setEntryError(
          getErrorMessage(
            selectionError,
            "Room created, but we could not load card selection yet.",
          ),
        );
        setScreen("lobby");
      }
    }
  }, [onNeedCardSelection, seedRoom]);

  const handlePaymentConfirm = useCallback(async () => {
    if (!payRoom) return;
    setEntryError(null);
    try {
      const latestRoom = await roomsApi.getOne(payRoom.id);
      const player = await roomsApi.getMyPlayer(payRoom.id);

      seedRoom(latestRoom);
      setActiveRoom(latestRoom);
      setIsSpectator(false);
      setRoomCount(latestRoom._count?.players ?? latestRoom.players?.length ?? 0);
      setPlayerCards(player.cards ?? []);
      setSelectedCardId(player.cards?.[0]?.id ?? null);
      setPayRoom(null);

      if ((player.cards?.length ?? 0) > 0) {
        setScreen("game");
        return;
      }

      await onNeedCardSelection(latestRoom, latestRoom.cardsPerPlayer);
      setScreen("card-select");
    } catch (error) {
      setPayRoom(null);
      setScreen("lobby");
      setEntryError(
        getErrorMessage(
          error,
          "Your room join was accepted, but we could not load the room state. Please re-open the room to continue.",
        ),
      );
    }
  }, [onNeedCardSelection, payRoom, seedRoom]);

  useRouteRoomEntry({
    roomEntryId,
    userId,
    activeRoomId: activeRoom?.id,
    payRoomId: payRoom?.id,
    entryError,
    resolveRoom,
    setEntryError,
    setPayRoom,
    handleRejoin,
    handleSpectate,
    seedRoom,
  });

  return {
    screen,
    search,
    filter,
    showCreate,
    payRoom,
    code,
    activeRoom,
    playerCards,
    selectedCardId,
    rejoining,
    roomCount,
    entryError,
    isSpectator,
    roomsData,
    isLoading,
    waiting: roomsData.filter((room) => room.status === "WAITING").length,
    playing: roomsData.filter((room) => room.status === "PLAYING").length,
    isHost: activeRoom?.host?.id === userId,
    setSearch,
    setFilter,
    setShowCreate,
    setCode,
    setSelectedCardId,
    setEntryError,
    setPayRoom,
    setScreen,
    resolveRoom,
    openRoomFromLookup,
    handleRejoin,
    handleSpectate,
    handleCreatedRoomEntry,
    handlePaymentConfirm,
    closePayment() {
      setPayRoom(null);
    },
    onGameBack() {
      setIsSpectator(false);
      setScreen("lobby");
    },
    openGameWithCards,
  };
}
