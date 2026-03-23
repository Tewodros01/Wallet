import { motion } from "framer-motion";
import { FaCoins } from "react-icons/fa";

type KenoResultBannerProps = {
  matches: number;
  payout: number;
  picksCount: number;
};

export default function KenoResultBanner({
  matches,
  payout,
  picksCount,
}: KenoResultBannerProps) {
  const isWin = payout > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`rounded-2xl p-4 flex items-center gap-3 border ${
        isWin
          ? "bg-emerald-500/15 border-emerald-500/30"
          : "bg-rose-500/10 border-rose-500/20"
      }`}
    >
      <span className="text-3xl">{isWin ? "🎉" : "😔"}</span>
      <div className="flex-1">
        <p className="text-sm font-black text-white">
          {isWin ? "You Won!" : "Better luck next time"}
        </p>
        <p className="text-xs text-gray-400">
          {matches} match{matches !== 1 ? "es" : ""} out of {picksCount} picks
        </p>
      </div>
      {isWin && (
        <div className="flex items-center gap-1">
          <FaCoins className="text-yellow-400 text-sm" />
          <span className="text-lg font-black text-yellow-300">
            +{payout.toLocaleString()}
          </span>
        </div>
      )}
    </motion.div>
  );
}
