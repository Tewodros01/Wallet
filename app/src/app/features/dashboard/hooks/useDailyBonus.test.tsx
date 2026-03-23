import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDailyBonus } from "./useDailyBonus";

const mutate = vi.fn();
const play = vi.fn();

vi.mock("../../../../store/wallet.store", () => ({
  useWalletStore: (selector: (state: { balance: number }) => unknown) =>
    selector({ balance: 500 }),
}));

vi.mock("../../payments", () => ({
  useClaimDailyBonus: () => ({
    mutate,
  }),
}));

vi.mock("../../../../hooks/useSound", () => ({
  useGameSound: () => ({
    play,
  }),
}));

vi.mock("../../../../lib/confetti", () => ({
  fireConfetti: vi.fn(),
}));

vi.mock("../../../../lib/haptic", () => ({
  haptic: {
    medium: vi.fn(),
    success: vi.fn(),
    win: vi.fn(),
  },
}));

vi.mock("../../../../lib/errors", () => ({
  getErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}));

describe("useDailyBonus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
  });

  it("clears the selected prize when the backend reports cooldown", async () => {
    mutate.mockImplementation(
      (
        _payload: undefined,
        options?: { onError?: (error: unknown) => void },
      ) => {
        options?.onError?.(
          new Error("Daily bonus already claimed. Come back in 23h"),
        );
      },
    );

    const { result } = renderHook(() => useDailyBonus());

    act(() => {
      result.current.spin();
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.prize).not.toBeNull();

    act(() => {
      result.current.claim();
    });

    expect(result.current.prize).toBeNull();
    expect(result.current.alreadySpin).toBe(true);
  });
});
