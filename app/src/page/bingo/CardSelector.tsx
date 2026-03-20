import { FaCheck } from "react-icons/fa";
import { IoMdCard } from "react-icons/io";
import { AppBar, Pill } from "../../components/ui/Layout";
import type { AvailableRoomCard } from "../../types/game.types";
import { MiniCard } from "./bingoComponents";

interface Props {
  cards: AvailableRoomCard[];
  selectedCardIds: string[];
  maxCount: number;
  entryFee: number;
  balance: number;
  loading?: boolean;
  error?: string | null;
  onToggle: (cardId: string) => void;
  onConfirm: () => void | Promise<void>;
  onBack: () => void;
}

export default function CardSelector({
  cards,
  selectedCardIds,
  maxCount,
  entryFee,
  balance,
  loading = false,
  error = null,
  onToggle,
  onConfirm,
  onBack,
}: Props) {
  const totalCost = entryFee * selectedCardIds.length;
  const canAfford = balance >= totalCost;

  return (
    <div className="h-screen bg-gray-950 flex flex-col text-white overflow-hidden">
      <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-xl border-b border-white/[0.07]">
        <AppBar
          left={
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Go back"
                title="Go back"
                onClick={onBack}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
              >
                <span className="text-white text-sm">←</span>
              </button>
              <span className="text-base font-black">Your Card</span>
            </div>
          }
          right={
            <Pill
              icon={<IoMdCard className="text-violet-400" />}
              className="text-violet-300"
            >
              Up to {maxCount}
            </Pill>
          }
        />
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="shrink-0 px-4 pt-2.5 pb-2.5 border-b border-white/[0.07] bg-gray-950/95 backdrop-blur-xl">
          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/6 to-white/[0.02] px-3.5 py-2.5 shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
            <div className="flex items-start justify-between gap-2.5">
              <div>
                <h2 className="mt-1 text-base font-bold  leading-none uppercase text-emerald-300/80">
                  Pick Your Card
                </h2>
                <p className="mt-2 max-w-[13rem] text-[11px] leading-4 text-gray-300">
                  Select 1 to {maxCount} cards before the game starts.
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.06] px-2 py-1.5 text-right">
                <p className="text-[8px] uppercase tracking-[0.16em] text-gray-500">
                  Total
                </p>
                <p className="text-[11px] font-black text-yellow-300">
                  {entryFee === 0 ? "Free" : `${totalCost} coins`}
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-3 text-[10px] text-gray-400">
              <span className="truncate">
                {entryFee === 0
                  ? "Free room, free cards"
                  : `${entryFee} coins per card`}
              </span>
              <span className="font-semibold text-white">
                {selectedCardIds.length}/{maxCount} selected
              </span>
            </div>

            {!canAfford && selectedCardIds.length > 0 && (
              <div className="mt-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] font-semibold text-rose-300 text-center">
                Insufficient balance for {selectedCardIds.length} selected card
                {selectedCardIds.length === 1 ? "" : "s"}
              </div>
            )}

            <button
              type="button"
              disabled={
                selectedCardIds.length < 1 || cards.length === 0 || !canAfford
              }
              onClick={onConfirm}
              className="mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500 px-3 py-1.5 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(16,185,129,0.22)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading && (
                <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              {selectedCardIds.length > 0
                ? `Claim ${selectedCardIds.length} Card${selectedCardIds.length === 1 ? "" : "s"}`
                : "Select at least one card"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 content-start">
            {cards.map((c, index) => {
              const sel = selectedCardIds.includes(c.id);
              const disablePickMore =
                !sel && selectedCardIds.length >= maxCount;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={disablePickMore}
                  onClick={() => {
                    onToggle(c.id);
                  }}
                  className={`relative rounded-2xl p-3 text-left transition-all overflow-hidden border-2 ${disablePickMore ? "opacity-40 cursor-not-allowed border-white/[0.08] bg-white/[0.03]" : "active:scale-95"} ${sel ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]" : "border-white/[0.08] bg-white/[0.03] hover:border-white/20"}`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-gray-400">
                      Card #{index + 1}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${sel ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}
                    >
                      {sel && <FaCheck className="text-white text-[8px]" />}
                    </div>
                  </div>
                  <MiniCard board={c.board} />
                </button>
              );
            })}
          </div>

          {cards.length === 0 && (
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 text-sm text-gray-400 text-center">
              No more cards are available in this room right now.
            </div>
          )}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
