type BingoCardSelectionSummaryProps = {
  maxCount: number;
  entryFee: number;
  totalCost: number;
  selectedCount: number;
  canAfford: boolean;
  hasCards: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export default function BingoCardSelectionSummary({
  maxCount,
  entryFee,
  totalCost,
  selectedCount,
  canAfford,
  hasCards,
  loading = false,
  onConfirm,
}: BingoCardSelectionSummaryProps) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/6 to-white/[0.02] px-3.5 py-2.5 shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <h2 className="mt-1 text-base font-bold uppercase leading-none text-emerald-300/80">
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
          {entryFee === 0 ? "Free room, free cards" : `${entryFee} coins per card`}
        </span>
        <span className="font-semibold text-white">
          {selectedCount}/{maxCount} selected
        </span>
      </div>

      {!canAfford && selectedCount > 0 && (
        <div className="mt-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-center text-[10px] font-semibold text-rose-300">
          Insufficient balance for {selectedCount} selected card
          {selectedCount === 1 ? "" : "s"}
        </div>
      )}

      <button
        type="button"
        disabled={selectedCount < 1 || !hasCards || !canAfford}
        onClick={onConfirm}
        className="mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500 px-3 py-1.5 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(16,185,129,0.22)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading && (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        {selectedCount > 0
          ? `Claim ${selectedCount} Card${selectedCount === 1 ? "" : "s"}`
          : "Select at least one card"}
      </button>
    </div>
  );
}
