import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBingoChat } from "./useBingoChat";

const onHandlers = new Map<string, (payload: unknown) => void>();
const off = vi.fn();
const emit = vi.fn();

vi.mock("../../../lib/socket", () => ({
  connectSocket: () => ({
    on: (event: string, handler: (payload: unknown) => void) => {
      onHandlers.set(event, handler);
    },
    off,
    emit,
  }),
}));

describe("useBingoChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onHandlers.clear();
  });

  it("only appends messages for the active room", () => {
    const { result } = renderHook(() => useBingoChat("room-1"));
    const handleMessage = onHandlers.get("chat:message");

    expect(handleMessage).toBeDefined();

    act(() => {
      handleMessage?.({
        id: "1",
        roomId: "room-2",
        userId: "user-1",
        username: "Abebe",
        message: "wrong room",
        sentAt: new Date().toISOString(),
      });
    });

    expect(result.current.messages).toEqual([]);

    act(() => {
      handleMessage?.({
        id: "2",
        roomId: "room-1",
        userId: "user-1",
        username: "Abebe",
        message: "right room",
        sentAt: new Date().toISOString(),
      });
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.message).toBe("right room");
  });
});
