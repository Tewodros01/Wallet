import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { roomsApi } from "../../../../api/rooms.api";
import { roomKeys } from "./queryKeys";
import { getErrorMessage } from "../../../../lib/errors";
import { RoomStatus } from "../../../../types/enums";
import type {
  GameRoomDetail,
  GameRoomPlayer,
  PlayerCard,
} from "../../../../types/game.types";

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
  const handledRouteRoomId = useRef<string | null>(null);
  const routeEntryInFlight = useRef<string | null>(null);
  const roomsQuery = {
    status: filter === "all" ? undefined : filter,
    search: search || undefined,
  } as const;
  const { data: roomsData = [], isLoading } = useQuery({
    queryKey: roomKeys.all(roomsQuery),
    queryFn: () => roomsApi.getAll(roomsQuery),
    refetchInterval: 5000,
  });
  const qc = useQueryClient();

  const seedRoom = (room: GameRoomDetail) =>
    qc.setQueryData(roomKeys.one(room.id), room);

  const normalizeLookupValue = (value: string) => value.trim().toUpperCase();

  const matchRoomLookup = (room: GameRoomDetail, value: string) => {
    const normalized = normalizeLookupValue(value);
    return (
      room.id.toUpperCase() === normalized ||
      room.id.slice(-8).toUpperCase() === normalized
    );
  };

  const resolveRoom = async (value: string) => {
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
  };

  const openGameWithCards = (cards: PlayerCard[]) => {
    setPlayerCards(cards);
    setSelectedCardId(cards[0]?.id ?? null);
    setScreen("game");
  };

  const handleSpectate = (room: GameRoomDetail) => {
    setEntryError(null);
    seedRoom(room);
    setActiveRoom(room);
    setIsSpectator(true);
    setPlayerCards([]);
    setSelectedCardId(null);
    setRoomCount(room._count?.players ?? room.players?.length ?? 0);
    setScreen("game");
  };

  const openRoomFromLookup = async (room: GameRoomDetail) => {
    if (room.status === RoomStatus.PLAYING && !room.isPrivate) {
      handleSpectate(room);
      return;
    }

    if (room.status !== RoomStatus.WAITING) {
      setEntryError("That room is not open for new players right now.");
      return;
    }

    setPayRoom(room);
  };

  const handleRejoin = async (room: GameRoomDetail) => {
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
  };

  const handleCreatedRoomEntry = async (room: GameRoomDetail) => {
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
  };

  const handlePaymentConfirm = async () => {
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
  };

  useEffect(() => {
    if (!roomEntryId) return;
    if (activeRoom?.id === roomEntryId || payRoom?.id === roomEntryId) {
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
          setEntryError(
            "This room link is invalid or the room no longer exists.",
          );
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
  }, [roomEntryId, roomsData, userId, activeRoom?.id, payRoom?.id, entryError]);

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
