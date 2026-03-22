import { AnimatePresence, motion } from "framer-motion";
import type { RefObject } from "react";
import { FaTrophy } from "react-icons/fa";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import { MdTimer } from "react-icons/md";
import Button from "../../components/ui/Button";
import { AppBar, Avatar, Pill } from "../../components/ui/Layout";
import { LETTER_TEXT } from "../../features/bingo/bingoData";
import type { BingoChatMessage, PlayerCard } from "../../types";
import { BingoBall } from "./bingoComponents";

export function CalledDashboardHeader({
  calledCount,
  liveCount,
  offsetTop,
  remaining,
  unreadChat,
  userAvatar,
  userName,
  onToggleChat,
}: {
  calledCount: number;
  liveCount: number;
  offsetTop: number;
  remaining: number;
  unreadChat: number;
  userAvatar?: string | null;
  userName?: string | null;
  onToggleChat: () => void;
}) {
  return (
    <AppBar
      className="!fixed !left-0 !right-0 !z-40 !px-4 !py-2"
      style={{ top: offsetTop }}
      left={
        <Avatar
          src={userAvatar ?? "https://i.pravatar.cc/40"}
          name={userName ?? "You"}
          coins={String(liveCount)}
          ring="ring-cyan-400"
        />
      }
      right={
        <>
          <Pill icon={<MdTimer />}>{calledCount}/75</Pill>
          <Pill
            icon={<FaTrophy className="text-yellow-400" />}
            className="text-yellow-300"
          >
            {remaining} left
          </Pill>
          <button
            type="button"
            onClick={onToggleChat}
            className="relative w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <FiMessageCircle className="text-white text-sm" />
            {unreadChat > 0 && (
              <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">
                {unreadChat > 9 ? "9+" : unreadChat}
              </span>
            )}
          </button>
        </>
      }
    />
  );
}

export function CalledDashboardWinState({
  calledCount,
  isWinner,
  prize,
}: {
  calledCount: number;
  isWinner: boolean;
  prize?: number;
}) {
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
        {prize !== undefined ? (
          <p className="text-gray-400 mt-2 text-sm">
            {isWinner ? (
              <span className="text-yellow-300 font-black">
                +{prize} coins earned!
              </span>
            ) : (
              `Winner earned ${prize} coins`
            )}
          </p>
        ) : (
          <p className="text-gray-500 mt-2 text-sm">All numbers were called</p>
        )}
      </motion.div>
      <div className="text-sm text-gray-500">
        {calledCount} numbers were called
      </div>
    </div>
  );
}

export function CalledDashboardRecentCalls({
  calledNums,
  latest,
  latestLetter,
}: {
  calledNums: number[];
  latest: number;
  latestLetter: string | null;
}) {
  if (calledNums.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        Last Called
      </p>
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {[...calledNums]
          .reverse()
          .slice(0, 6)
          .map((number, index) => (
            <BingoBall
              key={number}
              n={number}
              large={index === 0}
              dim={index > 0}
            />
          ))}
      </div>
      {latestLetter && (
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-black ${LETTER_TEXT[latestLetter as keyof typeof LETTER_TEXT]}`}
          >
            {latestLetter} - {latest}
          </span>
          <span className="text-gray-700">·</span>
          <span className="text-xs text-gray-500">
            {calledNums.length} called
          </span>
        </div>
      )}
    </div>
  );
}

export function CalledDashboardCardTabs({
  cards,
  markedNumsByCardId,
  selectedCardId,
  onSelectCard,
}: {
  cards: PlayerCard[];
  markedNumsByCardId: Record<string, Set<number>>;
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
}) {
  if (cards.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        Your Cards
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {cards.map((card, index) => {
          const selected = card.id === selectedCardId;
          const markedCount =
            (markedNumsByCardId[card.id]?.size ?? card.markedNums.length + 1) -
            1;

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
  );
}

export function CalledDashboardClaimButton({
  disabled,
  isLoading,
  onClaim,
}: {
  disabled: boolean;
  isLoading: boolean;
  onClaim: () => Promise<void>;
}) {
  return (
    <div className="pt-1">
      <Button
        variant="gold"
        size="lg"
        loading={isLoading}
        onClick={onClaim}
        disabled={disabled}
      >
        🎉 BINGO!
      </Button>
    </div>
  );
}

export function CalledDashboardChatPanel({
  chatEndRef,
  chatInput,
  chatMsgs,
  isSendingChat,
  onChangeChatInput,
  onClose,
  onSendChat,
  show,
  userId,
}: {
  chatEndRef: RefObject<HTMLDivElement | null>;
  chatInput: string;
  chatMsgs: BingoChatMessage[];
  isSendingChat: boolean;
  onChangeChatInput: (value: string) => void;
  onClose: () => void;
  onSendChat: () => void;
  show: boolean;
  userId?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
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
              onClick={onClose}
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
              chatMsgs.map((message) => {
                const isOwnMessage = message.userId === userId;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                  >
                    <img
                      src={
                        message.avatar ??
                        `https://i.pravatar.cc/28?u=${message.userId}`
                      }
                      alt=""
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div
                      className={`max-w-[75%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col gap-0.5`}
                    >
                      {!isOwnMessage && (
                        <p className="text-[9px] text-gray-500 font-bold">
                          {message.username}
                        </p>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl text-xs font-medium ${
                          isOwnMessage
                            ? "bg-emerald-500 text-white rounded-tr-sm"
                            : "bg-white/8 text-white rounded-tl-sm"
                        }`}
                      >
                        {message.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-t border-white/7">
            <input
              type="text"
              aria-label="Chat message"
              placeholder="Type a message…"
              value={chatInput}
              onChange={(event) => onChangeChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSendChat();
                }
              }}
              maxLength={200}
              className="flex-1 bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              aria-label="Send message"
              title="Send message"
              onClick={onSendChat}
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
  );
}
