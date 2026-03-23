import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBingoGameFlow } from "./useBingoGameFlow";

const useBingoRoomEntryMock = vi.fn();
const useBingoCardSelectionMock = vi.fn();

vi.mock("./useBingoRoomEntry", () => ({
  useBingoRoomEntry: (...args: unknown[]) => useBingoRoomEntryMock(...args),
}));

vi.mock("./useBingoCardSelection", () => ({
  useBingoCardSelection: (...args: unknown[]) =>
    useBingoCardSelectionMock(...args),
}));

describe("useBingoGameFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("combines room entry and card selection state and forces caller view on spectate", async () => {
    const handleSpectate = vi.fn();
    const openCardSelection = vi.fn().mockResolvedValue(undefined);

    useBingoRoomEntryMock.mockReturnValue({
      screen: "lobby",
      search: "abc",
      filter: "all",
      showCreate: false,
      payRoom: null,
      code: "ROOM",
      activeRoom: { id: "room-1" },
      playerCards: [{ id: "card-a" }],
      selectedCardId: "card-a",
      rejoining: null,
      roomCount: 4,
      entryError: null,
      isSpectator: false,
      roomsData: [],
      isLoading: false,
      waiting: 1,
      playing: 2,
      isHost: true,
      setSearch: vi.fn(),
      setFilter: vi.fn(),
      setShowCreate: vi.fn(),
      setCode: vi.fn(),
      setSelectedCardId: vi.fn(),
      setEntryError: vi.fn(),
      setPayRoom: vi.fn(),
      setScreen: vi.fn(),
      resolveRoom: vi.fn(),
      openRoomFromLookup: vi.fn(),
      handleRejoin: vi.fn(),
      handleSpectate,
      handleCreatedRoomEntry: vi.fn(),
      handlePaymentConfirm: vi.fn(),
      closePayment: vi.fn(),
      onGameBack: vi.fn(),
      openGameWithCards: vi.fn(),
    });

    useBingoCardSelectionMock.mockReturnValue({
      availableCards: [{ id: "available-1" }],
      pendingCardIds: ["available-1"],
      maxCardsToSelect: 2,
      claimingCards: false,
      cardSelectionError: null,
      openCardSelection,
      confirmSelectedCards: vi.fn(),
      togglePendingCard: vi.fn(),
      onCardSelectBack: vi.fn(),
    });

    const { result } = renderHook(() =>
      useBingoGameFlow({ roomEntryId: "room-1", userId: "user-1" }),
    );

    expect(result.current.search).toBe("abc");
    expect(result.current.availableCards).toEqual([{ id: "available-1" }]);
    expect(result.current.pendingCardIds).toEqual(["available-1"]);
    expect(result.current.isHost).toBe(true);

    await act(async () => {
      await result.current.handleSpectate({ id: "room-1" } as never);
    });

    expect(result.current.gameView).toBe("caller");
    expect(handleSpectate).toHaveBeenCalledWith({ id: "room-1" });
  });

  it("forwards payment confirm to room entry state", async () => {
    const handlePaymentConfirm = vi.fn();

    useBingoRoomEntryMock.mockReturnValue({
      screen: "lobby",
      search: "",
      filter: "all",
      showCreate: false,
      payRoom: { id: "pay-room" },
      code: "",
      activeRoom: { id: "room-1" },
      playerCards: [],
      selectedCardId: null,
      rejoining: null,
      roomCount: 0,
      entryError: null,
      isSpectator: false,
      roomsData: [],
      isLoading: false,
      waiting: 0,
      playing: 0,
      isHost: false,
      setSearch: vi.fn(),
      setFilter: vi.fn(),
      setShowCreate: vi.fn(),
      setCode: vi.fn(),
      setSelectedCardId: vi.fn(),
      setEntryError: vi.fn(),
      setPayRoom: vi.fn(),
      setScreen: vi.fn(),
      resolveRoom: vi.fn(),
      openRoomFromLookup: vi.fn(),
      handleRejoin: vi.fn(),
      handleSpectate: vi.fn(),
      handleCreatedRoomEntry: vi.fn(),
      handlePaymentConfirm,
      closePayment: vi.fn(),
      onGameBack: vi.fn(),
      openGameWithCards: vi.fn(),
    });

    useBingoCardSelectionMock.mockReturnValue({
      availableCards: [],
      pendingCardIds: [],
      maxCardsToSelect: 1,
      claimingCards: false,
      cardSelectionError: null,
      openCardSelection: vi.fn(),
      confirmSelectedCards: vi.fn(),
      togglePendingCard: vi.fn(),
      onCardSelectBack: vi.fn(),
    });

    const { result } = renderHook(() =>
      useBingoGameFlow({ roomEntryId: "room-1", userId: "user-1" }),
    );

    await act(async () => {
      await result.current.handlePaymentConfirm();
    });

    expect(handlePaymentConfirm).toHaveBeenCalled();
  });

  it("forwards rejoin and preserves child hook state", async () => {
    const handleRejoin = vi.fn();

    useBingoRoomEntryMock.mockReturnValue({
      screen: "card-select",
      search: "",
      filter: "waiting",
      showCreate: true,
      payRoom: null,
      code: "JOIN",
      activeRoom: { id: "room-2" },
      playerCards: [{ id: "owned-1" }],
      selectedCardId: "owned-1",
      rejoining: "room-2",
      roomCount: 6,
      entryError: "test",
      isSpectator: false,
      roomsData: [{ id: "room-2" }],
      isLoading: false,
      waiting: 1,
      playing: 0,
      isHost: true,
      setSearch: vi.fn(),
      setFilter: vi.fn(),
      setShowCreate: vi.fn(),
      setCode: vi.fn(),
      setSelectedCardId: vi.fn(),
      setEntryError: vi.fn(),
      setPayRoom: vi.fn(),
      setScreen: vi.fn(),
      resolveRoom: vi.fn(),
      openRoomFromLookup: vi.fn(),
      handleRejoin,
      handleSpectate: vi.fn(),
      handleCreatedRoomEntry: vi.fn(),
      handlePaymentConfirm: vi.fn(),
      closePayment: vi.fn(),
      onGameBack: vi.fn(),
      openGameWithCards: vi.fn(),
    });

    useBingoCardSelectionMock.mockReturnValue({
      availableCards: [{ id: "new-1" }],
      pendingCardIds: ["new-1"],
      maxCardsToSelect: 1,
      claimingCards: true,
      cardSelectionError: "selecting",
      openCardSelection: vi.fn(),
      confirmSelectedCards: vi.fn(),
      togglePendingCard: vi.fn(),
      onCardSelectBack: vi.fn(),
    });

    const { result } = renderHook(() =>
      useBingoGameFlow({ roomEntryId: "room-2", userId: "user-1" }),
    );

    await act(async () => {
      await result.current.handleRejoin({ id: "room-2" } as never);
    });

    expect(result.current.screen).toBe("card-select");
    expect(result.current.rejoining).toBe("room-2");
    expect(result.current.pendingCardIds).toEqual(["new-1"]);
    expect(result.current.cardSelectionError).toBe("selecting");
    expect(handleRejoin).toHaveBeenCalledWith({ id: "room-2" });
  });
});
