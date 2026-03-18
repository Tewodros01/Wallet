import { createContext } from "react";
import { connectSocket } from "../lib/socket";

export type GameState = {
  calledNums:  number[];
  currentNum:  number | null;
  remaining:   number;
  markedNums:  Set<number>;
  card:        number[][] | null;
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
  markNumber:  (n: number) => void;
  claimBingo:  () => void;
  pauseGame:   () => void;
  resumeGame:  () => void;
};

export const INITIAL: GameState = {
  calledNums:  [],
  currentNum:  null,
  remaining:   75,
  markedNums:  new Set([0]),
  card:        null,
  winner:      null,
  isStarted:   false,
  isPaused:    false,
  isFinished:  false,
  playerCount: 0,
  error:       null,
};

export const GameContext = createContext<GameContextValue | null>(null);
export { connectSocket };
