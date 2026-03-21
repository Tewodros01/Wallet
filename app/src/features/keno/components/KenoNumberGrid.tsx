import { motion } from "framer-motion";

type KenoNumberGridProps = {
  numbers: number[];
  picked: Set<number>;
  drawn: number[];
  revealed: number[];
  phase: "pick" | "drawing" | "result";
  onToggle: (n: number) => void;
};

export default function KenoNumberGrid({
  numbers,
  picked,
  drawn,
  revealed,
  phase,
  onToggle,
}: KenoNumberGridProps) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-3">
      <div className="grid grid-cols-10 gap-1">
        {numbers.map((n) => {
          const isPicked = picked.has(n);
          const isDrawn = drawn.includes(n);
          const isRevealed = revealed.includes(n);
          const isHit = isPicked && isDrawn && phase !== "pick";
          const isMiss = isPicked && !isDrawn && phase === "result";
          const isDraw = !isPicked && isRevealed;

          return (
            <motion.button
              key={n}
              type="button"
              onClick={() => onToggle(n)}
              disabled={phase !== "pick"}
              whileTap={phase === "pick" ? { scale: 0.85 } : {}}
              animate={isHit ? { scale: [1, 1.25, 1.1] } : {}}
              transition={{ duration: 0.3 }}
              className={`aspect-square rounded-lg text-[10px] font-black flex items-center justify-center transition-colors ${
                isHit
                  ? "bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  : isMiss
                    ? "bg-rose-500/30 text-rose-400 border border-rose-500/40"
                    : isDraw
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : isPicked
                        ? "bg-yellow-400 text-gray-950 shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                        : "bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]"
              }`}
            >
              {n}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
        {[
          { color: "bg-yellow-400", label: "Your pick" },
          { color: "bg-emerald-500", label: "Match! 🎯" },
          { color: "bg-blue-500/40", label: "Drawn" },
          { color: "bg-rose-500/30", label: "Missed" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${color}`} />
            <span className="text-[9px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
