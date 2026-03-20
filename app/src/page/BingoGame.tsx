import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { roomsApi } from "../api/rooms.api";
import { roomKeys, useRooms } from "../hooks/useRooms";
import { getErrorMessage } from "../lib/errors";
import { useAuthStore } from "../store/auth.store";
import { useWalletStore } from "../store/wallet.store";
import { RoomStatus } from "../types/enums";
import type {
  AvailableRoomCard,
  GameRoomDetail,
  GameRoomPlayer,
  PlayerCard,
} from "../types/game.types";
import BingoLobby from "./bingo/BingoLobby";
import BingoRoomScreen from "./bingo/BingoRoomScreen";
import CardSelector from "./bingo/CardSelector";

type GameView = "player" | "caller";
type Filter = "all" | "waiting" | "playing";

// ─── Main Component ───────────────────────────────────────────────────────────
type Screen = "lobby" | "card-select" | "game";

export default function BingoGame() {
  const { id: roomIdParam } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const roomIdFromQuery = searchParams.get("room")?.trim() ?? "";
  const roomEntryId = roomIdParam ?? roomIdFromQuery;
  const balance = useWalletStore((s) => s.balance);
  const user = useAuthStore((s) => s.user);

  const [screen, setScreen] = useState<Screen>("lobby");
  const [gameView, setGameView] = useState<GameView>("player");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [payRoom, setPayRoom] = useState<GameRoomDetail | null>(null);
  const [code, setCode] = useState("");
  const [activeRoom, setActiveRoom] = useState<GameRoomDetail | null>(null);
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [availableCards, setAvailableCards] = useState<AvailableRoomCard[]>([]);
  const [pendingCardIds, setPendingCardIds] = useState<string[]>([]);
  const [maxCardsToSelect, setMaxCardsToSelect] = useState(1);
  const [claimingCards, setClaimingCards] = useState(false);
  const [cardSelectionError, setCardSelectionError] = useState<string | null>(
    null,
  );
  const [rejoining, setRejoining] = useState<string | null>(null);
  const [roomCount, setRoomCount] = useState(0);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const handledRouteRoomId = useRef<string | null>(null);
  const routeEntryInFlight = useRef<string | null>(null);

  const { data: roomsData = [], isLoading } = useRooms({
    status: filter === "all" ? undefined : filter,
    search: search || undefined,
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

    const localRoom = roomsData.find((room: GameRoomDetail) =>
      matchRoomLookup(room, normalized),
    );
    if (localRoom) return localRoom;

    try {
      return await roomsApi.getOne(normalized);
    } catch {
      const matchingRooms = await roomsApi.getAll({ search: normalized });
      return (
        matchingRooms.find((room: GameRoomDetail) =>
          matchRoomLookup(room, normalized),
        ) ?? null
      );
    }
  };

  const openCardSelection = async (room: GameRoomDetail, maxCount: number) => {
    try {
      const cards = await roomsApi.getAvailableCards(room.id);
      setAvailableCards(cards);
      setCardSelectionError(null);
    } catch (error) {
      setAvailableCards([]);
      setCardSelectionError(
        getErrorMessage(error, "Failed to load available cards"),
      );
    }
    setPendingCardIds([]);
    setMaxCardsToSelect(maxCount);
    setScreen("card-select");
  };

  const waiting = roomsData.filter(
    (r: GameRoomDetail) => r.status === "WAITING",
  ).length;
  const playing = roomsData.filter(
    (r: GameRoomDetail) => r.status === "PLAYING",
  ).length;
  const isHost = activeRoom?.host?.id === user?.id;

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
        await openCardSelection(room, room.cardsPerPlayer);
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

  const handleSpectate = (room: GameRoomDetail) => {
    setEntryError(null);
    seedRoom(room);
    setActiveRoom(room);
    setIsSpectator(true);
    setGameView("caller");
    setPlayerCards([]);
    setSelectedCardId(null);
    setRoomCount(room._count?.players ?? room.players?.length ?? 0);
    setScreen("game");
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
            (player: GameRoomPlayer) => player.user?.id === user?.id,
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
    roomsData,
    user?.id,
    activeRoom?.id,
    payRoom?.id,
    entryError,
  ]);

  // ── Card select screen ──
  if (screen === "card-select") {
    return (
      <CardSelector
        cards={availableCards}
        selectedCardIds={pendingCardIds}
        maxCount={maxCardsToSelect}
        entryFee={activeRoom?.entryFee ?? 0}
        balance={balance}
        loading={claimingCards}
        error={cardSelectionError}
        onToggle={(cardId) =>
          setPendingCardIds((prev) => {
            if (prev.includes(cardId)) {
              return prev.filter((id) => id !== cardId);
            }
            if (prev.length >= maxCardsToSelect) return prev;
            return [...prev, cardId];
          })
        }
        onConfirm={async () => {
          if (!activeRoom) return;
          setClaimingCards(true);
          setCardSelectionError(null);
          try {
            const result = await roomsApi.selectCards(
              activeRoom.id,
              pendingCardIds,
            );
            setPlayerCards(result.cards);
            setSelectedCardId(result.cards[0]?.id ?? null);
            setAvailableCards([]);
            setPendingCardIds([]);
            await qc.invalidateQueries({ queryKey: ["rooms"] });
            await qc.invalidateQueries({
              queryKey: roomKeys.one(activeRoom.id),
            });
            setScreen("game");
          } catch (error) {
            setCardSelectionError(
              getErrorMessage(error, "Failed to claim selected cards"),
            );
            try {
              const cards = await roomsApi.getAvailableCards(activeRoom.id);
              setAvailableCards(cards);
              setPendingCardIds([]);
            } catch {
              // Keep existing UI state if the refresh call also fails.
            }
          } finally {
            setClaimingCards(false);
          }
        }}
        onBack={() => {
          setPendingCardIds([]);
          setCardSelectionError(null);
          setScreen("lobby");
        }}
      />
    );
  }

  // ── Game screen ──
  if (screen === "game" && activeRoom) {
    return (
      <BingoRoomScreen
        activeRoom={activeRoom}
        gameView={gameView}
        isHost={isHost}
        isSpectator={isSpectator}
        playerCards={playerCards}
        selectedCardId={selectedCardId}
        roomCount={roomCount}
        onBack={() => {
          setIsSpectator(false);
          setScreen("lobby");
        }}
        onChangeView={setGameView}
        onSelectCard={setSelectedCardId}
      />
    );
  }

  return (
    <BingoLobby
      balance={balance}
      search={search}
      filter={filter}
      code={code}
      showCreate={showCreate}
      payRoom={payRoom}
      entryError={entryError}
      roomsData={roomsData}
      waiting={waiting}
      playing={playing}
      isLoading={isLoading}
      rejoining={rejoining}
      userId={user?.id}
      onSearchChange={setSearch}
      onFilterChange={setFilter}
      onCodeChange={setCode}
      onCreateOpen={() => setShowCreate(true)}
      onCreateClose={() => setShowCreate(false)}
      onEnterCreatedRoom={async (roomObj) => {
        seedRoom(roomObj);
        setActiveRoom(roomObj);
        setIsSpectator(false);
        setRoomCount(roomObj._count?.players ?? roomObj.players?.length ?? 1);
        try {
          const player = await roomsApi.getMyPlayer(roomObj.id);
          setPlayerCards(player.cards ?? []);
          setSelectedCardId(player.cards?.[0]?.id ?? null);
          if ((player.cards?.length ?? 0) > 0) {
            setScreen("game");
          } else {
            await openCardSelection(roomObj, roomObj.cardsPerPlayer);
          }
        } catch {
          setPlayerCards([]);
          setSelectedCardId(null);
          await openCardSelection(roomObj, roomObj.cardsPerPlayer);
        }
      }}
      onJoinRoom={setPayRoom}
      onRejoinRoom={handleRejoin}
      onSpectateRoom={handleSpectate}
      onResolveRoomCode={resolveRoom}
      onCodeResolved={openRoomFromLookup}
      onPaymentClose={() => setPayRoom(null)}
      onPaymentConfirm={async () => {
        if (!payRoom) return;
        setEntryError(null);
        seedRoom(payRoom);
        setActiveRoom(payRoom);
        setIsSpectator(false);
        setRoomCount(
          (payRoom._count?.players ?? payRoom.players?.length ?? 0) + 1,
        );
        setPlayerCards([]);
        setSelectedCardId(null);
        setPayRoom(null);
        await openCardSelection(payRoom, payRoom.cardsPerPlayer);
      }}
      onEntryErrorChange={setEntryError}
    />
  );
}
