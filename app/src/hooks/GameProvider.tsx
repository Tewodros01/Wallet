import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { GameContext, INITIAL, type GameState } from "./GameContext";
import { connectSocket } from "../lib/socket";
import type { RoomStateResponse } from "../types/game.types";

interface SocketAck {
  error?: {
    message?: string;
  };
}

export function GameProvider({ roomId, children }: { roomId: string; children: ReactNode }) {
  const [state, setState] = useState<GameState>(INITIAL);
  const socketRef = useRef(connectSocket());

  const set = useCallback((patch: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    const s = socketRef.current;

    const onCard         = ({ card }: { card: { board: number[][] } }) => set({ card: card.board });
    const onState        = (data: { calledNums: number[]; current: number | null; remaining: number }) =>
      set({ calledNums: data.calledNums, currentNum: data.current, remaining: data.remaining, isStarted: true });
    const onStarted      = () => set({ isStarted: true, isPaused: false });
    const onPaused       = () => set({ isPaused: true });
    const onResumed      = () => set({ isPaused: false });
    const onNumCalled    = (data: { number: number; calledNums: number[]; remaining: number }) =>
      set({ currentNum: data.number, calledNums: data.calledNums, remaining: data.remaining });
    const onMarked       = (data: { number: number; markedNums: number[] }) =>
      setState((prev) => ({ ...prev, markedNums: new Set([...data.markedNums, 0]) }));
    const onWinner       = (data: { userId: string; prize: number }) => set({ winner: data, isFinished: true });
    const onAllCalled    = () => set({ isFinished: true });
    const onPlayerJoined = ({ count }: { count: number }) => set({ playerCount: count });
    const onException    = ({ message }: { message: string }) => {
      set({ error: message });
      setTimeout(() => set({ error: null }), 3000);
    };

    const onConnectError = (err: Error) => {
      set({ error: `Connection error: ${err.message}` });
      setTimeout(() => set({ error: null }), 4000);
    };
    s.on("connect_error", onConnectError);

    s.on("player:card",        onCard);
    s.on("game:state",         onState);
    s.on("game:started",       onStarted);
    s.on("game:paused",        onPaused);
    s.on("game:resumed",       onResumed);
    s.on("game:number_called", onNumCalled);
    s.on("player:marked",      onMarked);
    s.on("game:winner",        onWinner);
    s.on("game:all_called",    onAllCalled);
    s.on("room:player_joined", onPlayerJoined);
    s.on("exception",          onException);

    const joinRoom = () => {
      s.emit("room:join", { roomId }, (_res: SocketAck) => {
        // after joining, request current room state to get accurate player count
        s.emit("room:state", { roomId }, (roomState: RoomStateResponse) => {
          if (roomState?.room?._count?.players) {
            set({ playerCount: roomState.room._count.players });
          }
        });
      });
    };
    s.on("connect", joinRoom);
    if (s.connected) joinRoom();

    return () => {
      s.off("connect",           joinRoom);
      s.off("connect_error",      onConnectError);
      s.off("player:card",        onCard);
      s.off("game:state",         onState);
      s.off("game:started",       onStarted);
      s.off("game:paused",        onPaused);
      s.off("game:resumed",       onResumed);
      s.off("game:number_called", onNumCalled);
      s.off("player:marked",      onMarked);
      s.off("game:winner",        onWinner);
      s.off("game:all_called",    onAllCalled);
      s.off("room:player_joined", onPlayerJoined);
      s.off("exception",          onException);
    };
  }, [roomId, set]);

  const startGame  = useCallback(() => {
    socketRef.current.emit("game:start", { roomId }, (res: SocketAck) => {
      if (res?.error) set({ error: res.error.message ?? "Failed to start game" });
    });
  }, [roomId, set]);
  const callNext   = useCallback(() => socketRef.current.emit("game:call_next", { roomId }), [roomId]);
  const markNumber = useCallback((number: number) => socketRef.current.emit("player:mark", { roomId, number }), [roomId]);
  const claimBingo = useCallback(() => socketRef.current.emit("game:bingo",    { roomId }), [roomId]);
  const pauseGame  = useCallback(() => socketRef.current.emit("game:pause",    { roomId }), [roomId]);
  const resumeGame = useCallback(() => socketRef.current.emit("game:resume",   { roomId }), [roomId]);

  return (
    <GameContext.Provider value={{ state, startGame, callNext, markNumber, claimBingo, pauseGame, resumeGame }}>
      {children}
    </GameContext.Provider>
  );
}
