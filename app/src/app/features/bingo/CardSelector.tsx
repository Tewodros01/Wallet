import { FaCheck } from "react-icons/fa";
import { IoMdCard } from "react-icons/io";
import type { AvailableRoomCard } from "../../../types/game.types";
import { AppBar, Pill } from "../../components/ui/Layout";
import { MiniCard } from "./bingoComponents";
import BingoCardSelectionSummary from "./components/BingoCardSelectionSummary";

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
      <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-xl border-b border-white/7">
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
        <div className="shrink-0 px-4 pt-2.5 pb-2.5 border-b border-white/7 bg-gray-950/95 backdrop-blur-xl">
          <BingoCardSelectionSummary
            maxCount={maxCount}
            entryFee={entryFee}
            totalCost={totalCost}
            selectedCount={selectedCardIds.length}
            canAfford={canAfford}
            hasCards={cards.length > 0}
            loading={loading}
            onConfirm={onConfirm}
          />
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
                  className={`relative rounded-2xl p-3 text-left transition-all overflow-hidden border-2 ${disablePickMore ? "opacity-40 cursor-not-allowed border-white/8 bg-white/3" : "active:scale-95"} ${sel ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]" : "border-white/8 bg-white/3 hover:border-white/20"}`}
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
            <div className="bg-white/4 border border-white/7 rounded-2xl p-4 text-sm text-gray-400 text-center">
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
