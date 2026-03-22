import type { ReactNode } from "react";
import {
  ALL_NUMBERS,
  COLS,
  LETTER_COLOR,
  LETTER_TAILWIND,
  getLetter,
} from "../../features/bingo/bingoData";

type BingoBoard = readonly (readonly number[])[];

/* ── BingoBall ── */
export const BingoBall = ({
  n,
  large = false,
  dim = false,
}: {
  n: number;
  large?: boolean;
  dim?: boolean;
}) => {
  const l = getLetter(n);
  const bg = LETTER_TAILWIND[l as keyof typeof LETTER_TAILWIND];
  return (
    <div
      className={`relative shrink-0 ${dim ? "opacity-40" : ""}`}
      style={{ width: large ? 80 : 44, height: large ? 80 : 44 }}
    >
      {large && (
        <div
          className={`absolute inset-0 rounded-full ${bg} opacity-30 ping-slow`}
        />
      )}
      <div
        className={`absolute inset-0 rounded-full ${bg} flex flex-col items-center justify-center border-2 border-white/20`}
        style={{
          boxShadow: large
            ? `0 0 36px ${LETTER_COLOR[l as keyof typeof LETTER_COLOR]}99`
            : "none",
        }}
      >
        <span
          className={`font-black text-white leading-none opacity-80 ${large ? "text-[11px]" : "text-[7px]"}`}
        >
          {l}
        </span>
        <span
          className={`font-black text-white leading-none ${large ? "text-3xl" : "text-sm"}`}
        >
          {n}
        </span>
      </div>
    </div>
  );
};

/* ── BingoCard ── */
export const BingoCard = ({
  board,
  marked,
  called,
  latestCall,
  onToggle,
}: {
  board: BingoBoard;
  marked: Set<number>;
  called: Set<number>;
  latestCall?: number;
  onToggle?: (n: number) => void;
}) => (
  <div className="bg-white/3 border border-white/10 rounded-2xl p-2.5">
    <div className="grid grid-cols-5 gap-1.5 mb-1.5">
      {COLS.map((l) => (
        <div
          key={l}
          className={`${LETTER_TAILWIND[l as keyof typeof LETTER_TAILWIND]} rounded-xl py-2.5 flex items-center justify-center font-black text-white text-xl`}
        >
          {l}
        </div>
      ))}
    </div>
    {board.map((row, ri) => (
      <div key={ri} className="grid grid-cols-5 gap-1.5 mb-1.5">
        {row.map((n, ci) => {
          const isFree = ri === 2 && ci === 2;
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
                ${
                  isFree
                    ? "bg-yellow-400 text-gray-900"
                    : isMarked
                      ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                      : isCalled
                        ? "bg-white/10 text-white ring-1 ring-emerald-500/50"
                        : "bg-white/3 text-gray-600 cursor-default"
                }`}
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
export const MiniCard = ({ board }: { board: BingoBoard }) => (
  <div className="grid grid-cols-5 gap-0.5">
    {COLS.map((l) => (
      <div
        key={l}
        className={`${LETTER_TAILWIND[l as keyof typeof LETTER_TAILWIND]} rounded-sm py-0.5 text-center text-[7px] font-black text-white`}
      >
        {l}
      </div>
    ))}
    {board.map((row, ri) =>
      row.map((n, ci) => {
        const isFree = ri === 2 && ci === 2;
        return (
          <div
            key={`${ri}-${ci}`}
            className={`rounded-sm py-1 text-center text-[8px] font-bold leading-none ${isFree ? "bg-yellow-400 text-gray-900" : "bg-white/7 text-gray-400"}`}
          >
            {isFree ? "★" : n}
          </div>
        );
      }),
    )}
  </div>
);

/* ── NumberBoard ── */
export const NumberBoard = ({ called }: { called: number[] }) => {
  const set = new Set(called);
  return (
    <div className="grid grid-cols-5 gap-1">
      {COLS.map((l) => (
        <div
          key={l}
          className={`${LETTER_TAILWIND[l as keyof typeof LETTER_TAILWIND]} rounded-lg py-1.5 text-center text-[10px] font-black text-white`}
        >
          {l}
        </div>
      ))}
      {ALL_NUMBERS.map((n) => {
        const hit = set.has(n);
        const l = getLetter(n);
        return (
          <div
            key={n}
            className={`rounded-lg py-1.5 text-center text-[10px] font-bold transition-all ${hit ? `${LETTER_TAILWIND[l as keyof typeof LETTER_TAILWIND]} text-white` : "bg-white/4 text-gray-600"}`}
          >
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
    {[...called]
      .reverse()
      .slice(0, 14)
      .map((n, i) => (
        <BingoBall key={n} n={n} large={i === 0} dim={i > 0} />
      ))}
  </div>
);

/* ── StatBadge ── */
export const StatBadge = ({
  icon,
  value,
  sub,
}: {
  icon: ReactNode;
  value: string;
  sub: string;
}) => (
  <div className="flex-1 bg-white/4 border border-white/7 rounded-2xl flex flex-col items-center gap-0.5 py-3">
    <span className="text-lg leading-none">{icon}</span>
    <span className="text-base font-black text-white leading-tight">
      {value}
    </span>
    <span className="text-[10px] text-gray-500 uppercase tracking-wide">
      {sub}
    </span>
  </div>
);
