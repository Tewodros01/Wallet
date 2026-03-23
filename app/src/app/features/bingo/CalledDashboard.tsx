import { useEffect, useRef, useState } from "react";
import { useGame } from "../../../hooks/useGame";
import { useRoom } from "./hooks";
import { useGameSound } from "../../../hooks/useSound";
import { fireSideConfetti } from "../../../lib/confetti";
import { haptic } from "../../../lib/haptic";
import { useAuthStore } from "../../../store/auth.store";
import type { GameRoomDetail, PlayerCard } from "../../../types";
import {
  CalledDashboardCardTabs,
  CalledDashboardChatPanel,
  CalledDashboardClaimButton,
  CalledDashboardHeader,
  CalledDashboardRecentCalls,
  CalledDashboardWinState,
} from "./CalledDashboardSections";
import { BingoCard, StatBadge } from "./bingoComponents";
import { getLetter } from "./bingoData";
import { useBingoChat } from "./useBingoChat";

const PLAYER_BAR_OFFSET_PX = 100;

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
  const didWin = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isClaimingBingo, setIsClaimingBingo] = useState(false);
  const {
    closeChat,
    input: chatInput,
    isSending: isSendingChat,
    messages: chatMsgs,
    sendChat,
    setInput: setChatInput,
    showChat,
    toggleChat,
    unreadCount: unreadChat,
  } = useBingoChat(roomId);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, showChat]);

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

  if (isFinished || winner) {
    const isWinner = winner?.userId === user?.id;
    return (
      <CalledDashboardWinState
        calledCount={calledNums.length}
        isWinner={isWinner}
        prize={winner?.prize}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <CalledDashboardHeader
        calledCount={calledNums.length}
        liveCount={liveCount}
        offsetTop={PLAYER_BAR_OFFSET_PX}
        remaining={state.remaining}
        unreadChat={unreadChat}
        userAvatar={user?.avatar}
        userName={user?.firstName}
        onToggleChat={toggleChat}
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

        <CalledDashboardRecentCalls
          calledNums={calledNums}
          latest={latest}
          latestLetter={ll}
        />

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

        <CalledDashboardCardTabs
          cards={cards}
          markedNumsByCardId={markedNumsByCardId}
          selectedCardId={resolvedCardId}
          onSelectCard={onSelectCard}
        />

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

        <CalledDashboardClaimButton
          isLoading={isClaimingBingo}
          disabled={!state.isStarted || isFinished || isClaimingBingo}
          onClaim={async () => {
            if (!resolvedCardId) {
              return;
            }

            setIsClaimingBingo(true);
            try {
              await claimBingo(resolvedCardId);
            } catch {
              // Errors are surfaced through shared socket/game state.
            } finally {
              setIsClaimingBingo(false);
            }
          }}
        />
      </div>

      <CalledDashboardChatPanel
        chatEndRef={chatEndRef}
        chatInput={chatInput}
        chatMsgs={chatMsgs}
        isSendingChat={isSendingChat}
        onChangeChatInput={setChatInput}
        onClose={closeChat}
        onSendChat={sendChat}
        show={showChat}
        userId={user?.id}
      />
    </div>
  );
}
