import type { PlayerCard } from "../types/game.types";
import { createContext } from "react";
import { connectSocket } from "../lib/socket";

export type GameState = {
  calledNums:  number[];
  currentNum:  number | null;
  remaining:   number;
  countdown:   number | null;
  isStarting:  boolean;
  cards:       PlayerCard[];
  activeCardId: string | null;
  markedNumsByCardId: Record<string, Set<number>>;
  winner:      { userId: string; prize: number } | null;
  isStarted:   boolean;
  isPaused:    boolean;
  isFinished:  boolean;
  playerCount: number;
  error:       string | null;
};

export type GameContextValue = {
  state:       GameState;
  startGame:   () => void;
  callNext:    () => void;
  markNumber:  (n: number, cardId?: string) => Promise<void>;
  claimBingo:  (cardId?: string) => Promise<void>;
  pauseGame:   () => void;
  resumeGame:  () => void;
  setActiveCard: (cardId: string) => void;
};

export const INITIAL: GameState = {
  calledNums:  [],
  currentNum:  null,
  remaining:   75,
  countdown:   null,
  isStarting:  false,
  cards:       [],
  activeCardId: null,
  markedNumsByCardId: {},
  winner:      null,
  isStarted:   false,
  isPaused:    false,
  isFinished:  false,
  playerCount: 0,
  error:       null,
};

export const GameContext = createContext<GameContextValue | null>(null);
export { connectSocket };
