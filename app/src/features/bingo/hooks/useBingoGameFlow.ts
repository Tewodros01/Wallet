import { useRef, useState } from "react";
import type { GameRoomDetail } from "../../../types/game.types";
import { useBingoCardSelection } from "./useBingoCardSelection";
import { useBingoRoomEntry } from "./useBingoRoomEntry";

type Screen = "lobby" | "card-select" | "game";

type UseBingoGameFlowParams = {
  roomEntryId: string;
  userId?: string;
};

export function useBingoGameFlow({
  roomEntryId,
  userId,
}: UseBingoGameFlowParams) {
  const [gameView, setGameView] = useState<"player" | "caller">("player");
  const openCardSelectionRef = useRef<
    (room: GameRoomDetail, maxCount: number) => Promise<void>
  >(async () => {});

  const roomEntry = useBingoRoomEntry({
    roomEntryId,
    userId,
    onNeedCardSelection: async (room, maxCount) => {
      await openCardSelectionRef.current(room, maxCount);
    },
  });

  const cardSelection = useBingoCardSelection({
    activeRoom: roomEntry.activeRoom,
    onCardsConfirmed: roomEntry.openGameWithCards,
    onOpenGame: () => roomEntry.setScreen("game"),
    onReturnToLobby: () => roomEntry.setScreen("lobby"),
    onClearEntryError: () => roomEntry.setEntryError(null),
  });

  openCardSelectionRef.current = cardSelection.openCardSelection;

  return {
    screen: roomEntry.screen as Screen,
    gameView,
    search: roomEntry.search,
    filter: roomEntry.filter,
    showCreate: roomEntry.showCreate,
    payRoom: roomEntry.payRoom,
    code: roomEntry.code,
    activeRoom: roomEntry.activeRoom,
    playerCards: roomEntry.playerCards,
    selectedCardId: roomEntry.selectedCardId,
    availableCards: cardSelection.availableCards,
    pendingCardIds: cardSelection.pendingCardIds,
    maxCardsToSelect: cardSelection.maxCardsToSelect,
    claimingCards: cardSelection.claimingCards,
    cardSelectionError: cardSelection.cardSelectionError,
    rejoining: roomEntry.rejoining,
    roomCount: roomEntry.roomCount,
    entryError: roomEntry.entryError,
    isSpectator: roomEntry.isSpectator,
    roomsData: roomEntry.roomsData,
    isLoading: roomEntry.isLoading,
    waiting: roomEntry.waiting,
    playing: roomEntry.playing,
    isHost: roomEntry.isHost,
    setGameView,
    setSearch: roomEntry.setSearch,
    setFilter: roomEntry.setFilter,
    setShowCreate: roomEntry.setShowCreate,
    setCode: roomEntry.setCode,
    setSelectedCardId: roomEntry.setSelectedCardId,
    setEntryError: roomEntry.setEntryError,
    setPayRoom: roomEntry.setPayRoom,
    togglePendingCard: cardSelection.togglePendingCard,
    onCardSelectBack: cardSelection.onCardSelectBack,
    onGameBack: roomEntry.onGameBack,
    resolveRoom: roomEntry.resolveRoom,
    openRoomFromLookup: roomEntry.openRoomFromLookup,
    handleRejoin: roomEntry.handleRejoin,
    handleSpectate(room: GameRoomDetail) {
      setGameView("caller");
      roomEntry.handleSpectate(room);
    },
    handleCreatedRoomEntry: roomEntry.handleCreatedRoomEntry,
    confirmSelectedCards: cardSelection.confirmSelectedCards,
    handlePaymentConfirm: roomEntry.handlePaymentConfirm,
    closePayment: roomEntry.closePayment,
  };
}
