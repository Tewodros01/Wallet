import { FiZap } from "react-icons/fi";

type KenoPickSummaryProps = {
  picksCount: number;
  maxPick: number;
  showQuickPick: boolean;
  onQuickPick: () => void;
};

export default function KenoPickSummary({
  picksCount,
  maxPick,
  showQuickPick,
  onQuickPick,
}: KenoPickSummaryProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-white">{picksCount}</span>
        <span className="text-xs text-gray-500">/ {maxPick} numbers picked</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: maxPick }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i < picksCount ? "bg-yellow-400" : "bg-white/[0.10]"
              }`}
            />
          ))}
        </div>
        {showQuickPick && (
          <button
            type="button"
            onClick={onQuickPick}
            className="flex items-center gap-1 rounded-xl border border-violet-500/30 bg-violet-500/15 px-2.5 py-1.5 text-[10px] font-black text-violet-400 transition-all active:scale-95"
          >
            <FiZap className="text-[10px]" /> Re-roll Picks
          </button>
        )}
      </div>
    </div>
  );
}
