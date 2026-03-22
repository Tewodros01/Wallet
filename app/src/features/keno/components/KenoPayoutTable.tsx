import { motion } from "framer-motion";
import { FaTrophy } from "react-icons/fa";
import { GiCoins } from "react-icons/gi";

type KenoPayoutTableProps = {
  picksCount: number;
  bet: number;
  payouts: Record<number, number> | undefined;
};

export default function KenoPayoutTable({
  picksCount,
  bet,
  payouts,
}: KenoPayoutTableProps) {
  if (!payouts || picksCount <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 rounded-2xl border border-white/7 bg-white/4 p-4"
    >
      <div className="mb-1 flex items-center gap-2">
        <FaTrophy className="text-xs text-yellow-400" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Payout Table ({picksCount} picks)
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(payouts).map(([match, mult]) => (
          <div
            key={match}
            className="flex items-center justify-between rounded-xl bg-white/4 px-3 py-2"
          >
            <span className="text-xs text-gray-400">
              {match} match{Number(match) > 1 ? "es" : ""}
            </span>
            <div className="flex items-center gap-1">
              <GiCoins className="text-[10px] text-yellow-400" />
              <span className="text-xs font-black text-yellow-300">
                {(mult * bet).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
