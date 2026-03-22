import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { GameContext, INITIAL, type GameState } from "./GameContext";
import { useGameSound } from "./useSound";
import { connectSocket } from "../lib/socket";
import { announceNumber, cancelAnnouncement } from "../lib/announcer";
import { haptic } from "../lib/haptic";
import { useSoundStore } from "../store/sound.store";
import type { PlayerCard, RoomStateResponse } from "../types/game.types";

interface SocketAck {
  success?: boolean;
  error?: {
    message?: string;
  };
}

const SOCKET_ACK_TIMEOUT_MS = 5000;
type ParticipationMode = "player" | "spectator";

const toMarkedMap = (cards: PlayerCard[]) =>
  Object.fromEntries(
    cards.map((card) => [card.id, new Set([0, ...card.markedNums])]),
  ) as Record<string, Set<number>>;

export function GameProvider({
  roomId,
  children,
  initialCards = [],
  initialActiveCardId = null,
  participationMode = "player",
}: {
  roomId: string;
  children: ReactNode;
  initialCards?: PlayerCard[];
  initialActiveCardId?: string | null;
  participationMode?: ParticipationMode;
}) {
  const [state, setState] = useState<GameState>({
    ...INITIAL,
    cards: initialCards,
    activeCardId: initialActiveCardId ?? initialCards[0]?.id ?? null,
    markedNumsByCardId: toMarkedMap(initialCards),
  });
  const socketRef = useRef(connectSocket());
  const announcedLenRef = useRef<number | null>(null);
  const { play } = useGameSound();
  const muted = useSoundStore((s) => s.muted);

  const set = useCallback((patch: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const emitWithAck = useCallback(
    <T extends SocketAck>(event: string, payload: object, fallbackMessage: string) =>
      new Promise<T>((resolve, reject) => {
        const socket = socketRef.current;

        if (!socket.connected) {
          const message = "Socket is disconnected";
          set({ error: message });
          reject(new Error(message));
          return;
        }

        const timeoutId = window.setTimeout(() => {
          set({ error: fallbackMessage });
          reject(new Error(fallbackMessage));
        }, SOCKET_ACK_TIMEOUT_MS);

        socket.emit(event, payload, (res?: T) => {
          window.clearTimeout(timeoutId);

          if (res?.error?.message) {
            set({ error: res.error.message });
            reject(new Error(res.error.message));
            return;
          }

          resolve((res ?? { success: true }) as T);
        });
      }),
    [set],
  );

  useEffect(() => {
    const s = socketRef.current;
    const joinEvent =
      participationMode === "spectator" ? "spectator:join" : "room:join";
    const leaveEvent =
      participationMode === "spectator" ? "spectator:leave" : "room:leave";

    const onCards        = ({ cards }: { cards: PlayerCard[] }) =>
      setState((prev) => ({
        ...prev,
        cards,
        activeCardId:
          prev.activeCardId && cards.some((card) => card.id === prev.activeCardId)
            ? prev.activeCardId
            : (cards[0]?.id ?? null),
        markedNumsByCardId: toMarkedMap(cards),
      }));
    const onState        = (data: { calledNums: number[]; current: number | null; remaining: number; countdown?: number | null }) =>
      set({
        calledNums: data.calledNums,
        currentNum: data.current,
        remaining: data.remaining,
        countdown: data.countdown ?? null,
        isStarting: false,
        isStarted: (data.countdown ?? null) === null,
      });
    const onCountdown    = (data: { countdown: number | null }) =>
      set({
        countdown: data.countdown,
        isStarting: false,
        isStarted: false,
        isPaused: false,
      });
    const onStarted      = () =>
      set({
        isStarted: true,
        isPaused: false,
        isStarting: false,
      });
    const onPaused       = () => set({ isPaused: true });
    const onResumed      = () => set({ isPaused: false });
    const onNumCalled    = (data: { number: number; calledNums: number[]; remaining: number }) =>
      set({
        currentNum: data.number,
        calledNums: data.calledNums,
        remaining: data.remaining,
        isStarted: true,
        countdown: null,
        isStarting: false,
      });
    const onMarked       = (data: { cardId: string; number: number; markedNums: number[] }) =>
      setState((prev) => ({
        ...prev,
        markedNumsByCardId: {
          ...prev.markedNumsByCardId,
          [data.cardId]: new Set([0, ...data.markedNums]),
        },
      }));
    const onWinner       = (data: { userId: string; prize: number }) => set({ winner: data, isFinished: true });
    const onAllCalled    = () => set({ isFinished: true });
    const onCancelled    = (data?: { message?: string }) =>
      set({
        isFinished: true,
        isStarted: false,
        countdown: null,
        isStarting: false,
        error: data?.message ?? "Game was cancelled",
      });
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

    s.on("player:cards",       onCards);
    s.on("game:state",         onState);
    s.on("game:countdown",     onCountdown);
    s.on("game:started",       onStarted);
    s.on("game:paused",        onPaused);
    s.on("game:resumed",       onResumed);
    s.on("game:number_called", onNumCalled);
    s.on("player:marked",      onMarked);
    s.on("game:winner",        onWinner);
    s.on("game:all_called",    onAllCalled);
    s.on("game:cancelled",     onCancelled);
    s.on("room:player_joined", onPlayerJoined);
    s.on("exception",          onException);

    const joinRoom = () => {
      s.emit(joinEvent, { roomId }, (res?: SocketAck) => {
        if (res?.error?.message) {
          set({ error: res.error.message });
          return;
        }

        // After joining, request current room state to get accurate player count.
        s.emit("room:state", { roomId }, (roomState: RoomStateResponse) => {
          if (roomState?.room?._count?.players !== undefined) {
            set({ playerCount: roomState.room._count.players });
          }
        });
      });
    };
    s.on("connect", joinRoom);
    if (s.connected) joinRoom();

    return () => {
      if (s.connected) {
        s.emit(leaveEvent, { roomId });
      }
      s.off("connect",           joinRoom);
      s.off("connect_error",      onConnectError);
      s.off("player:cards",       onCards);
      s.off("game:state",         onState);
      s.off("game:countdown",     onCountdown);
      s.off("game:started",       onStarted);
      s.off("game:paused",        onPaused);
      s.off("game:resumed",       onResumed);
      s.off("game:number_called", onNumCalled);
      s.off("player:marked",      onMarked);
      s.off("game:winner",        onWinner);
      s.off("game:all_called",    onAllCalled);
      s.off("game:cancelled",     onCancelled);
      s.off("room:player_joined", onPlayerJoined);
      s.off("exception",          onException);
    };
  }, [participationMode, roomId, set]);

  useEffect(() => {
    if (announcedLenRef.current === null) {
      announcedLenRef.current = state.calledNums.length;
      return;
    }

    if (state.calledNums.length > announcedLenRef.current) {
      const latest = state.calledNums[state.calledNums.length - 1];
      play("ding");
      haptic.medium();
      announceNumber(latest, muted);
    }

    announcedLenRef.current = state.calledNums.length;
  }, [muted, play, state.calledNums]);

  useEffect(() => () => cancelAnnouncement(), []);

  const startGame  = useCallback(() => {
    set({ isStarting: true, countdown: null, isStarted: false, error: null });
    socketRef.current.emit("game:start", { roomId }, (res: SocketAck) => {
      if (res?.error) {
        set({
          error: res.error.message ?? "Failed to start game",
          countdown: null,
          isStarted: false,
          isStarting: false,
        });
      }
    });
  }, [roomId, set]);
  const callNext   = useCallback(() => socketRef.current.emit("game:call_next", { roomId }), [roomId]);
  const markNumber = useCallback(async (number: number, cardId?: string) => {
    const resolvedCardId = cardId ?? state.activeCardId;
    if (!resolvedCardId) return;
    await emitWithAck(
      "player:mark",
      { roomId, cardId: resolvedCardId, number },
      "Failed to mark number",
    );
  }, [emitWithAck, roomId, state.activeCardId]);
  const claimBingo = useCallback(async (cardId?: string) => {
    const resolvedCardId = cardId ?? state.activeCardId;
    if (!resolvedCardId) return;
    await emitWithAck(
      "game:bingo",
      { roomId, cardId: resolvedCardId },
      "BINGO claim timed out. Please try again.",
    );
  }, [emitWithAck, roomId, state.activeCardId]);
  const pauseGame  = useCallback(() => socketRef.current.emit("game:pause",    { roomId }), [roomId]);
  const resumeGame = useCallback(() => socketRef.current.emit("game:resume",   { roomId }), [roomId]);
  const setActiveCard = useCallback((cardId: string) => {
    set({ activeCardId: cardId });
  }, [set]);

  return (
    <GameContext.Provider value={{ state, startGame, callNext, markNumber, claimBingo, pauseGame, resumeGame, setActiveCard }}>
      {children}
    </GameContext.Provider>
  );
}
