import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FaTrophy } from "react-icons/fa";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import { MdTimer } from "react-icons/md";
import Button from "../../components/ui/Button";
import { AppBar, Avatar, Pill } from "../../components/ui/Layout";
import { getLetter, LETTER_TEXT } from "../../features/bingo/bingoData";
import { useGame } from "../../hooks/useGame";
import { useRoom } from "../../hooks/useRooms";
import { useGameSound } from "../../hooks/useSound";
import { announceNumber, cancelAnnouncement } from "../../lib/announcer";
import { fireSideConfetti } from "../../lib/confetti";
import { haptic } from "../../lib/haptic";
import { connectSocket } from "../../lib/socket";
import { useAuthStore } from "../../store/auth.store";
import { useSoundStore } from "../../store/sound.store";
import type { BingoChatMessage, GameRoomDetail, PlayerCard } from "../../types";
import { BingoBall, BingoCard, StatBadge } from "./bingoComponents";

const PLAYER_BAR_OFFSET_PX = 100;
const CHAT_ACK_TIMEOUT_MS = 4000;

interface CalledDashboardProps {
  cards: PlayerCard[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  roomId: string;
  playerCount: number;
  roomData?: GameRoomDetail;
}

export default function CalledDashboard({
  cards: initialCards,
  selectedCardId,
  onSelectCard,
  roomId,
  playerCount: initialCount,
  roomData,
}: CalledDashboardProps) {
  const user = useAuthStore((s) => s.user);
  const { state, markNumber, claimBingo, setActiveCard } = useGame();
  const { data: room } = useRoom(roomId, roomData);
  const { play } = useGameSound();
  const muted = useSoundStore((s) => s.muted);
  const prevLen = useRef(0);
  const didWin = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showChat, setShowChat] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<BingoChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadChat, setUnreadChat] = useState(0);
  const [isClaimingBingo, setIsClaimingBingo] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Subscribe to chat events
  useEffect(() => {
    const socket = connectSocket();
    const handler = (msg: BingoChatMessage) => {
      setChatMsgs((prev) => [...prev.slice(-99), msg]);
      if (!showChat) setUnreadChat((n) => n + 1);
    };
    socket.on("chat:message", handler);
    return () => {
      socket.off("chat:message", handler);
    };
  }, [showChat]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, showChat]);

  const sendChat = () => {
    const msg = chatInput.trim();
    if (!msg || isSendingChat) return;
    const socket = connectSocket();
    setIsSendingChat(true);

    const timeoutId = window.setTimeout(() => {
      setIsSendingChat(false);
    }, CHAT_ACK_TIMEOUT_MS);

    socket.emit(
      "chat:send",
      { roomId, message: msg },
      (res?: { success?: boolean; error?: { message?: string } }) => {
        window.clearTimeout(timeoutId);
        setIsSendingChat(false);

        if (res?.error?.message) {
          return;
        }

        setChatInput("");
      },
    );
  };

  const {
    calledNums,
    currentNum,
    cards: serverCards,
    activeCardId,
    markedNumsByCardId,
    winner,
    isFinished,
    error,
  } = state;
  const players = room?.players ?? [];
  const dbCount = room?._count?.players ?? players.length ?? initialCount;
  const liveCount =
    state.playerCount > 0
      ? state.playerCount
      : dbCount > 0
        ? dbCount
        : initialCount;

  const cards = serverCards.length ? serverCards : initialCards;
  const resolvedCardId = selectedCardId ?? activeCardId ?? cards[0]?.id ?? null;
  const activeCard = cards.find((card) => card.id === resolvedCardId) ?? null;
  const markedNums = resolvedCardId
    ? (markedNumsByCardId[resolvedCardId] ?? new Set([0]))
    : new Set([0]);
  const board = activeCard?.board ?? null;
  const called = new Set(calledNums);
  const latest = currentNum ?? 0;
  const ll = latest ? getLetter(latest) : null;

  useEffect(() => {
    if (resolvedCardId) {
      setActiveCard(resolvedCardId);
    }
  }, [resolvedCardId, setActiveCard]);

  // Pop sound + spoken announcement on each new number
  useEffect(() => {
    if (calledNums.length > prevLen.current) {
      const n = calledNums[calledNums.length - 1];
      play("pop");
      haptic.light();
      announceNumber(n, muted);
      prevLen.current = calledNums.length;
    }
  }, [calledNums, play, muted]);

  // Win/loss sound + confetti
  useEffect(() => {
    if ((isFinished || winner) && !didWin.current) {
      didWin.current = true;
      const isWinner = winner?.userId === user?.id;
      if (isWinner) {
        play("win");
        haptic.win();
        fireSideConfetti();
      } else {
        play("error");
        haptic.error();
      }
    }
  }, [isFinished, winner, user?.id, play]);

  useEffect(() => {
    if (error || winner || isFinished) {
      setIsClaimingBingo(false);
    }
  }, [error, winner, isFinished]);

  // Cancel speech on unmount
  useEffect(() => () => cancelAnnouncement(), []);

  if (isFinished || winner) {
    const isWinner = winner?.userId === user?.id;
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-5 text-white">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl ${
            isWinner
              ? "bg-emerald-500/20 border-2 border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
              : "bg-rose-500/20 border-2 border-rose-500/40"
          }`}
        >
          {isWinner ? "🎉" : "😔"}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-3xl font-black">
            {isWinner ? "BINGO! You Won!" : "Game Over"}
          </h2>
          {winner && (
            <p className="text-gray-400 mt-2 text-sm">
              {isWinner ? (
                <span className="text-yellow-300 font-black">
                  +{winner.prize} coins earned!
                </span>
              ) : (
                `Winner earned ${winner.prize} coins`
              )}
            </p>
          )}
          {!winner && (
            <p className="text-gray-500 mt-2 text-sm">
              All numbers were called
            </p>
          )}
        </motion.div>
        <div className="text-sm text-gray-500">
          {calledNums.length} numbers were called
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        className="!fixed !left-0 !right-0 !z-40 !px-4 !py-2"
        style={{ top: PLAYER_BAR_OFFSET_PX }}
        left={
          <Avatar
            src={user?.avatar ?? "https://i.pravatar.cc/40"}
            name={user?.firstName ?? "You"}
            coins={String(liveCount)}
            ring="ring-cyan-400"
          />
        }
        right={
          <>
            <Pill icon={<MdTimer />}>{calledNums.length}/75</Pill>
            <Pill
              icon={<FaTrophy className="text-yellow-400" />}
              className="text-yellow-300"
            >
              {state.remaining} left
            </Pill>
            <button
              type="button"
              onClick={() => {
                setShowChat((v) => !v);
                setUnreadChat(0);
              }}
              className="relative w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiMessageCircle className="text-white text-sm" />
              {unreadChat > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">
                  {unreadChat > 9 ? "9+" : unreadChat}
                </span>
              )}
            </button>
          </>
        }
      />

      <div
        className="flex flex-col gap-4 px-5 pb-5 flex-1"
        style={{ paddingTop: PLAYER_BAR_OFFSET_PX }}
      >
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2 text-xs text-rose-400 font-semibold text-center">
            {error}
          </div>
        )}

        {!state.isStarted && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-xs text-orange-400 font-semibold text-center animate-pulse">
            Waiting for host to start the game...
          </div>
        )}

        {calledNums.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Last Called
            </p>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {[...calledNums]
                .reverse()
                .slice(0, 6)
                .map((n, i) => (
                  <BingoBall key={n} n={n} large={i === 0} dim={i > 0} />
                ))}
            </div>
            {ll && (
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-black ${LETTER_TEXT[ll as keyof typeof LETTER_TEXT]}`}
                >
                  {ll} — {latest}
                </span>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-gray-500">
                  {calledNums.length} called
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <StatBadge
            icon="✅"
            value={String(markedNums.size - 1)}
            sub="Marked"
          />
          <StatBadge icon="📢" value={String(calledNums.length)} sub="Called" />
          <StatBadge
            icon="🎯"
            value={String(75 - calledNums.length)}
            sub="Left"
          />
        </div>

        {cards.length > 1 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Your Cards
            </p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {cards.map((card, index) => {
                const selected = card.id === resolvedCardId;
                const markedCount =
                  (markedNumsByCardId[card.id]?.size ??
                    card.markedNums.length + 1) - 1;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onSelectCard(card.id)}
                    className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                      selected
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.18)]"
                        : "bg-white/4 border-white/10 text-gray-400 hover:bg-white/8"
                    }`}
                  >
                    Card {index + 1} · {markedCount} marked
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {board ? (
          <div className="flex flex-col gap-1.5 flex-1">
            <BingoCard
              board={board}
              marked={markedNums}
              called={called}
              latestCall={latest}
              onToggle={async (n) => {
                if (!resolvedCardId) return;
                try {
                  await markNumber(n, resolvedCardId);
                  haptic.light();
                } catch {
                  // Errors are surfaced through shared socket/game state.
                }
              }}
            />
            <p className="text-center text-[11px] text-gray-600">
              Tap a highlighted number to mark it
            </p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
            Waiting for card assignment...
          </div>
        )}

        <div className="pt-1">
          <Button
            variant="gold"
            size="lg"
            loading={isClaimingBingo}
            onClick={async () => {
              if (!resolvedCardId) return;
              setIsClaimingBingo(true);
              try {
                await claimBingo(resolvedCardId);
              } catch {
                setIsClaimingBingo(false);
              }
            }}
            disabled={!state.isStarted || isFinished || isClaimingBingo}
          >
            🎉 BINGO!
          </Button>
        </div>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[60] bg-gray-900 border-t border-white/10 flex flex-col"
            style={{ maxHeight: "55vh" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/7">
              <p className="text-sm font-black text-white flex items-center gap-2">
                <FiMessageCircle /> Room Chat
              </p>
              <button
                type="button"
                aria-label="Close chat"
                title="Close chat"
                onClick={() => setShowChat(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"
              >
                <FiX className="text-gray-400 text-xs" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {chatMsgs.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-6">
                  No messages yet. Say hi! 👋
                </p>
              ) : (
                chatMsgs.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2 ${m.userId === user?.id ? "flex-row-reverse" : ""}`}
                  >
                    <img
                      src={m.avatar ?? `https://i.pravatar.cc/28?u=${m.userId}`}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div
                      className={`max-w-[75%] ${m.userId === user?.id ? "items-end" : "items-start"} flex flex-col gap-0.5`}
                    >
                      {m.userId !== user?.id && (
                        <p className="text-[9px] text-gray-500 font-bold">
                          {m.username}
                        </p>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl text-xs font-medium ${
                          m.userId === user?.id
                            ? "bg-emerald-500 text-white rounded-tr-sm"
                            : "bg-white/8 text-white rounded-tl-sm"
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/7">
              <input
                type="text"
                aria-label="Chat message"
                placeholder="Type a message…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void sendChat();
                }}
                maxLength={200}
                className="flex-1 bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50"
              />
              <button
                type="button"
                aria-label="Send message"
                title="Send message"
                onClick={() => void sendChat()}
                disabled={!chatInput.trim() || isSendingChat}
                className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
              >
                {isSendingChat ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <FiSend className="text-white text-sm" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
