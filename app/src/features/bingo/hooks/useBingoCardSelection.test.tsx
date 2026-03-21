import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBingoCardSelection } from "./useBingoCardSelection";

const invalidateQueries = vi.fn();
const getAvailableCards = vi.fn();
const selectCards = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries,
  }),
}));

vi.mock("../../../hooks/useRooms", () => ({
  roomKeys: {
    one: (id: string) => ["rooms", id],
  },
}));

vi.mock("../../../api/rooms.api", () => ({
  roomsApi: {
    getAvailableCards,
    selectCards,
  },
}));

vi.mock("../../../lib/errors", () => ({
  getErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

describe("useBingoCardSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads cards and confirms selected cards successfully", async () => {
    const onCardsConfirmed = vi.fn();
    const onOpenGame = vi.fn();
    getAvailableCards.mockResolvedValue([{ id: "card-1", board: [] }]);
    selectCards.mockResolvedValue({ cards: [{ id: "card-1" }] });

    const { result } = renderHook(() =>
      useBingoCardSelection({
        activeRoom: { id: "room-1" } as never,
        onCardsConfirmed,
        onOpenGame,
        onReturnToLobby: vi.fn(),
        onClearEntryError: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.openCardSelection({ id: "room-1" } as never, 2);
    });

    act(() => {
      result.current.togglePendingCard("card-1");
    });

    await act(async () => {
      await result.current.confirmSelectedCards();
    });

    expect(onCardsConfirmed).toHaveBeenCalledWith([{ id: "card-1" }]);
    expect(onOpenGame).toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
  });

  it("refreshes available cards after a failed confirm attempt", async () => {
    getAvailableCards
      .mockResolvedValueOnce([{ id: "card-1", board: [] }])
      .mockResolvedValueOnce([{ id: "card-2", board: [] }]);
    selectCards.mockRejectedValue(new Error("nope"));

    const { result } = renderHook(() =>
      useBingoCardSelection({
        activeRoom: { id: "room-1" } as never,
        onCardsConfirmed: vi.fn(),
        onOpenGame: vi.fn(),
        onReturnToLobby: vi.fn(),
        onClearEntryError: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.openCardSelection({ id: "room-1" } as never, 1);
    });

    act(() => {
      result.current.togglePendingCard("card-1");
    });

    await act(async () => {
      await result.current.confirmSelectedCards();
    });

    expect(result.current.cardSelectionError).toBe(
      "Failed to claim selected cards",
    );
    expect(result.current.availableCards).toEqual([{ id: "card-2", board: [] }]);
    expect(result.current.pendingCardIds).toEqual([]);
    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
