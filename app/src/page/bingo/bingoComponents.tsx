import type { ReactNode } from "react";

export const LETTER_COLOR = { B: "#f43f5e", I: "#f97316", N: "#10b981", G: "#14b8a6", O: "#06b6d4" };
export const LETTER_TAILWIND = { B: "bg-rose-500", I: "bg-orange-500", N: "bg-emerald-500", G: "bg-teal-500", O: "bg-cyan-500" };
export const LETTER_TEXT = { B: "text-rose-400", I: "text-orange-400", N: "text-emerald-400", G: "text-teal-400", O: "text-cyan-400" };
export const COLS = ["B", "I", "N", "G", "O"];
export const ALL_NUMBERS = Array.from({ length: 75 }, (_, i) => i + 1);

export const SAMPLE_CARDS = [
  { id: 1, board: [[6,17,35,58,73],[7,19,43,60,68],[4,29,0,59,70],[3,30,40,54,62],[9,21,38,48,67]] },
  { id: 2, board: [[12,20,33,46,65],[5,28,44,57,72],[15,16,0,50,63],[1,25,31,53,74],[10,22,42,49,61]] },
  { id: 3, board: [[8,18,36,47,66],[13,27,41,56,75],[2,24,0,51,64],[11,26,34,55,69],[14,23,37,52,71]] },
  { id: 4, board: [[3,16,32,60,72],[9,22,45,47,65],[15,30,0,53,68],[6,19,38,58,74],[12,28,41,50,63]] },
];

export const getLetter = (n: number) => n <= 15 ? "B" : n <= 30 ? "I" : n <= 45 ? "N" : n <= 60 ? "G" : "O";

/* ── BingoBall ── */
export const BingoBall = ({ n, large = false, dim = false }: { n: number; large?: boolean; dim?: boolean }) => {
  const l = getLetter(n);
  const bg = LETTER_TAILWIND[l as keyof typeof LETTER_TAILWIND];
  return (
    <div className={`relative shrink-0 ${dim ? "opacity-40" : ""}`} style={{ width: large ? 80 : 44, height: large ? 80 : 44 }}>
      {large && <div className={`absolute inset-0 rounded-full ${bg} opacity-30 ping-slow`} />}
      <div
        className={`absolute inset-0 rounded-full ${bg} flex flex-col items-center justify-center border-2 border-white/20`}
        style={{ boxShadow: large ? `0 0 36px ${LETTER_COLOR[l as keyof typeof LETTER_COLOR]}99` : "none" }}
      >
        <span className={`font-black text-white leading-none opacity-80 ${large ? "text-[11px]" : "text-[7px]"}`}>{l}</span>
        <span className={`font-black text-white leading-none ${large ? "text-3xl" : "text-sm"}`}>{n}</span>
      </div>
    </div>
  );
};

/* ── BingoCard ── */
export const BingoCard = ({
  board, marked, called, latestCall, onToggle,
}: {
  board: number[][];
  marked: Set<number>;
  called: Set<number>;
  latestCall?: number;
  onToggle?: (n: number) => void;
}) => (
  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5">
    <div className="grid grid-cols-5 gap-1.5 mb-1.5">
      {COLS.map((l) => (
        <div key={l} className={`${LETTER_TAILWIND[l as keyof typeof LETTER_TAILWIND]} rounded-xl py-2.5 flex items-center justify-center font-black text-white text-xl`}>{l}</div>
      ))}
    </div>
    {board.map((row, ri) => (
      <div key={ri} className="grid grid-cols-5 gap-1.5 mb-1.5">
        {row.map((n, ci) => {
          const isFree   = ri === 2 && ci === 2;
          const isCalled = isFree || called.has(n);
          const isMarked = isFree || marked.has(n);
          const isLatest = n === latestCall;
          return (
            <button
              key={ci}
              type="button"
              disabled={isFree || !isCalled}
              onClick={() => onToggle?.(n)}
              className={`relative rounded-xl py-3.5 flex items-center justify-center font-bold text-base transition-all active:scale-90
                ${isFree    ? "bg-yellow-400 text-gray-900"
                : isMarked  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                : isCalled  ? "bg-white/10 text-white ring-1 ring-emerald-500/50"
                              : "bg-white/[0.03] text-gray-600 cursor-default"}`}
            >
              {isFree ? "⭐" : n}
              {isLatest && !isMarked && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full pulse-dot" />
              )}
            </button>
          );
        })}
      </div>
    ))}
  </div>
);

/* ── MiniCard ── */
export const MiniCard = ({ board }: { board: number[][] }) => (
  <div className="grid grid-cols-5 gap-0.5">
    {COLS.map((l) => (
      <div key={l} className={`${LETTER_TAILWIND[l as keyof typeof LETTER_TAILWIND]} rounded-sm py-0.5 text-center text-[7px] font-black text-white`}>{l}</div>
    ))}
    {board.map((row, ri) =>
      row.map((n, ci) => {
        const isFree = ri === 2 && ci === 2;
        return (
          <div key={`${ri}-${ci}`} className={`rounded-sm py-1 text-center text-[8px] font-bold leading-none ${isFree ? "bg-yellow-400 text-gray-900" : "bg-white/[0.07] text-gray-400"}`}>
            {isFree ? "★" : n}
          </div>
        );
      })
    )}
  </div>
);

/* ── NumberBoard ── */
export const NumberBoard = ({ called }: { called: number[] }) => {
  const set = new Set(called);
  return (
    <div className="grid grid-cols-5 gap-1">
      {COLS.map((l) => (
        <div key={l} className={`${LETTER_TAILWIND[l as keyof typeof LETTER_TAILWIND]} rounded-lg py-1.5 text-center text-[10px] font-black text-white`}>{l}</div>
      ))}
      {ALL_NUMBERS.map((n) => {
        const hit = set.has(n);
        const l = getLetter(n);
        return (
          <div key={n} className={`rounded-lg py-1.5 text-center text-[10px] font-bold transition-all ${hit ? `${LETTER_TAILWIND[l as keyof typeof LETTER_TAILWIND]} text-white` : "bg-white/[0.04] text-gray-600"}`}>
            {n}
          </div>
        );
      })}
    </div>
  );
};

/* ── RecentCalls ── */
export const RecentCalls = ({ called }: { called: number[] }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
    {[...called].reverse().slice(0, 14).map((n, i) => (
      <BingoBall key={n} n={n} large={i === 0} dim={i > 0} />
    ))}
  </div>
);

/* ── StatBadge ── */
export const StatBadge = ({ icon, value, sub }: { icon: ReactNode; value: string; sub: string }) => (
  <div className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-2xl flex flex-col items-center gap-0.5 py-3">
    <span className="text-lg leading-none">{icon}</span>
    <span className="text-base font-black text-white leading-tight">{value}</span>
    <span className="text-[10px] text-gray-500 uppercase tracking-wide">{sub}</span>
  </div>
);
