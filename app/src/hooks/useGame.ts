import { useContext } from "react";
import { GameContext, type GameContextValue } from "./GameContext";

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
