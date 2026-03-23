import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { roomsApi } from "../../../../api/rooms.api";
import { roomKeys } from "./queryKeys";
import { getErrorMessage } from "../../../../lib/errors";
import type {
  AvailableRoomCard,
  GameRoomDetail,
  PlayerCard,
} from "../../../../types/game.types";

type UseBingoCardSelectionParams = {
  activeRoom: GameRoomDetail | null;
  onCardsConfirmed: (cards: PlayerCard[]) => void;
  onOpenGame: () => void;
  onReturnToLobby: () => void;
  onClearEntryError: () => void;
};

export function useBingoCardSelection({
  activeRoom,
  onCardsConfirmed,
  onOpenGame,
  onReturnToLobby,
  onClearEntryError,
}: UseBingoCardSelectionParams) {
  const [availableCards, setAvailableCards] = useState<AvailableRoomCard[]>([]);
  const [pendingCardIds, setPendingCardIds] = useState<string[]>([]);
  const [maxCardsToSelect, setMaxCardsToSelect] = useState(1);
  const [claimingCards, setClaimingCards] = useState(false);
  const [cardSelectionError, setCardSelectionError] = useState<string | null>(
    null,
  );
  const qc = useQueryClient();

  const openCardSelection = async (room: GameRoomDetail, maxCount: number) => {
    try {
      const cards = await roomsApi.getAvailableCards(room.id);
      setAvailableCards(cards);
      setCardSelectionError(null);
    } catch (error) {
      setAvailableCards([]);
      const message = getErrorMessage(error, "Failed to load available cards");
      setCardSelectionError(message);
      throw new Error(message);
    }
    setPendingCardIds([]);
    setMaxCardsToSelect(maxCount);
  };

  const confirmSelectedCards = async () => {
    if (!activeRoom) return;
    setClaimingCards(true);
    setCardSelectionError(null);
    try {
      const result = await roomsApi.selectCards(activeRoom.id, pendingCardIds);
      setAvailableCards([]);
      setPendingCardIds([]);
      await qc.invalidateQueries({ queryKey: ["rooms"] });
      await qc.invalidateQueries({ queryKey: roomKeys.one(activeRoom.id) });
      onCardsConfirmed(result.cards);
      onOpenGame();
    } catch (error) {
      setCardSelectionError(
        getErrorMessage(error, "Failed to claim selected cards"),
      );
      try {
        const cards = await roomsApi.getAvailableCards(activeRoom.id);
        setAvailableCards(cards);
        setPendingCardIds([]);
      } catch {
        // Keep current UI state if refresh fails too.
      }
    } finally {
      setClaimingCards(false);
    }
  };

  return {
    availableCards,
    pendingCardIds,
    maxCardsToSelect,
    claimingCards,
    cardSelectionError,
    openCardSelection,
    confirmSelectedCards,
    togglePendingCard(cardId: string) {
      setPendingCardIds((prev) => {
        if (prev.includes(cardId)) {
          return prev.filter((id) => id !== cardId);
        }
        if (prev.length >= maxCardsToSelect) return prev;
        return [...prev, cardId];
      });
    },
    onCardSelectBack() {
      setPendingCardIds([]);
      setCardSelectionError(null);
      onClearEntryError();
      onReturnToLobby();
    },
  };
}
