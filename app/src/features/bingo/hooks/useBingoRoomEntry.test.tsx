import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBingoRoomEntry } from "./useBingoRoomEntry";

const setQueryData = vi.fn();
const getMyPlayer = vi.fn();
const getOne = vi.fn();
const getAll = vi.fn();
const useRoomsMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData,
  }),
}));

vi.mock("../../../hooks/useRooms", () => ({
  roomKeys: {
    one: (id: string) => ["rooms", id],
  },
  useRooms: (...args: unknown[]) => useRoomsMock(...args),
}));

vi.mock("../../../api/rooms.api", () => ({
  roomsApi: {
    getMyPlayer,
    getOne,
    getAll,
  },
}));

vi.mock("../../../lib/errors", () => ({
  getErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

describe("useBingoRoomEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRoomsMock.mockReturnValue({ data: [], isLoading: false });
  });

  it("opens card selection when rejoining without cards", async () => {
    const onNeedCardSelection = vi.fn().mockResolvedValue(undefined);
    getMyPlayer.mockResolvedValue({ cards: [] });

    const room = {
      id: "room-1",
      status: "WAITING",
      cardsPerPlayer: 2,
      _count: { players: 4 },
      players: [],
    };

    const { result } = renderHook(() =>
      useBingoRoomEntry({
        roomEntryId: "",
        userId: "user-1",
        onNeedCardSelection,
      }),
    );

    await act(async () => {
      await result.current.handleRejoin(room as never);
    });

    expect(onNeedCardSelection).toHaveBeenCalledWith(room, 2);
    expect(result.current.screen).toBe("card-select");
    expect(result.current.rejoining).toBeNull();
  });

  it("opens game immediately when the rejoining player already has cards", async () => {
    getMyPlayer.mockResolvedValue({ cards: [{ id: "card-1" }] });

    const room = {
      id: "room-2",
      status: "WAITING",
      cardsPerPlayer: 2,
      _count: { players: 3 },
      players: [],
    };

    const { result } = renderHook(() =>
      useBingoRoomEntry({
        roomEntryId: "",
        userId: "user-1",
        onNeedCardSelection: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleRejoin(room as never);
    });

    expect(result.current.screen).toBe("game");
    expect(result.current.playerCards).toEqual([{ id: "card-1" }]);
  });
});
