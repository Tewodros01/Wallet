import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FaCoins, FaTrophy } from "react-icons/fa";
import { FiArrowLeft, FiRefreshCw, FiZap } from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import CoinCounter from "../components/ui/CoinCounter";
import { usePlayKeno } from "../hooks/usePayments";
import { useGameSound } from "../hooks/useSound";
import { fireConfetti } from "../lib/confetti";
import { getErrorMessage } from "../lib/errors";
import { haptic } from "../lib/haptic";
import { toast } from "../store/toast.store";
import { useWalletStore } from "../store/wallet.store";

const MAX_PICK = 10;
const TOTAL = 80;
const DRAW_SIZE = 20;
const BETS = [10, 25, 50, 100, 200, 500];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 3 },
  2: { 2: 12 },
  3: { 2: 2, 3: 40 },
  4: { 2: 1, 3: 5, 4: 100 },
  5: { 3: 3, 4: 20, 5: 500 },
  6: { 3: 2, 4: 8, 5: 100, 6: 1500 },
  7: { 3: 1, 4: 5, 5: 40, 6: 400, 7: 5000 },
  8: { 4: 3, 5: 20, 6: 100, 7: 1000, 8: 10000 },
  9: { 4: 2, 5: 10, 6: 50, 7: 500, 8: 5000, 9: 25000 },
  10: { 5: 5, 6: 20, 7: 100, 8: 1000, 9: 10000, 10: 100000 },
};

type Phase = "pick" | "drawing" | "result";

export default function Keno() {
  const navigate = useNavigate();
  const balance = useWalletStore((s) => s.balance);
  const { mutate: playKeno, isPending } = usePlayKeno();
  const { play } = useGameSound();

  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [bet, setBet] = useState(50);
  const [phase, setPhase] = useState<Phase>("pick");
  const [drawn, setDrawn] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [result, setResult] = useState<{
    matches: number;
    payout: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const toggle = (n: number) => {
    if (phase !== "pick") return;
    setPicked((prev) => {
      const s = new Set(prev);
      if (s.has(n)) {
        s.delete(n);
        haptic.light();
        return s;
      }
      if (s.size >= MAX_PICK) return s;
      s.add(n);
      haptic.light();
      return s;
    });
  };

  const quickPick = () => {
    if (phase !== "pick") return;
    const count = Math.min(MAX_PICK, 5);
    const picks = shuffle(Array.from({ length: TOTAL }, (_, i) => i + 1)).slice(
      0,
      count,
    );
    setPicked(new Set(picks));
    haptic.medium();
  };

  const play_ = () => {
    if (picked.size === 0 || balance < bet || isPending) return;
    haptic.medium();

    setRevealed([]);
    setResult(null);
    setPhase("drawing");

    const picksArr = [...picked];
    playKeno(
      { bet, picks: picksArr },
      {
        onSuccess: (data) => {
          const draw = data.drawn;
          setDrawn(draw);
          // animate reveal of server-drawn numbers
          draw.forEach((num, i) => {
            const t = setTimeout(() => {
              setRevealed((r) => [...r, num]);
              if (i === draw.length - 1) {
                setResult({ matches: data.matches, payout: data.payout });
                setPhase("result");
                if (data.payout > 0) {
                  play("win");
                  haptic.win();
                  fireConfetti();
                  toast.success(
                    `🎰 You won ${data.payout.toLocaleString()} coins!`,
                  );
                } else {
                  play("error");
                  haptic.error();
                  toast.info("No match this time. Try again!");
                }
              }
            }, i * 160);
            timerRef.current.push(t);
          });
        },
        onError: (err: unknown) => {
          setPhase("pick");
          play("error");
          haptic.error();
          toast.error(getErrorMessage(err, "Failed to process round"));
        },
      },
    );
  };

  const reset = () => {
    clearTimers();
    setPicked(new Set());
    setDrawn([]);
    setRevealed([]);
    setResult(null);
    setPhase("pick");
    haptic.light();
  };

  const nums = Array.from({ length: 80 }, (_, i) => i + 1);
  const isWin = (result?.payout ?? 0) > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/[0.06] px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            title="Go back"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center"
          >
            <FiArrowLeft className="text-white text-sm" />
          </button>
          <div>
            <p className="text-base font-black text-white">Keno</p>
            <p className="text-[10px] text-gray-500">
              Pick up to 10 · Draw 20 of 80
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/keno/history")}
            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            History
          </button>
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1.5">
            <CoinCounter value={balance} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 pb-8">
        {/* Result banner */}
        <AnimatePresence>
          {phase === "result" && result && (
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
                  {result.matches} match{result.matches !== 1 ? "es" : ""} out
                  of {picked.size} picks
                </p>
              </div>
              {isWin && (
                <div className="flex items-center gap-1">
                  <FaCoins className="text-yellow-400 text-sm" />
                  <span className="text-lg font-black text-yellow-300">
                    +{result.payout.toLocaleString()}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Number grid */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-3">
          <div className="grid grid-cols-10 gap-1">
            {nums.map((n) => {
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
                  onClick={() => toggle(n)}
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

        {/* Pick counter + Quick Pick */}
        <div className="flex items-center justify-between bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white">{picked.size}</span>
            <span className="text-xs text-gray-500">
              / {MAX_PICK} numbers picked
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {Array.from({ length: MAX_PICK }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${i < picked.size ? "bg-yellow-400" : "bg-white/[0.10]"}`}
                />
              ))}
            </div>
            {phase === "pick" && (
              <button
                type="button"
                onClick={quickPick}
                className="flex items-center gap-1 bg-violet-500/15 border border-violet-500/30 text-violet-400 text-[10px] font-black px-2.5 py-1.5 rounded-xl active:scale-95 transition-all"
              >
                <FiZap className="text-[10px]" /> Quick Pick
              </button>
            )}
          </div>
        </div>

        {/* Bet selector */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Bet Amount
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {BETS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  if (phase === "pick") {
                    setBet(b);
                    haptic.light();
                  }
                }}
                disabled={phase !== "pick"}
                className={`py-2 rounded-xl text-xs font-black transition-all ${
                  bet === b
                    ? "bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "bg-white/[0.06] text-gray-400"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Payout table */}
        {picked.size > 0 && phase === "pick" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <FaTrophy className="text-yellow-400 text-xs" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Payout Table ({picked.size} picks)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(PAYOUTS[picked.size] ?? {}).map(
                ([match, mult]) => (
                  <div
                    key={match}
                    className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2"
                  >
                    <span className="text-xs text-gray-400">
                      {match} match{Number(match) > 1 ? "es" : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      <GiCoins className="text-yellow-400 text-[10px]" />
                      <span className="text-xs font-black text-yellow-300">
                        {(mult * bet).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </motion.div>
        )}

        {/* Drawing animation */}
        {phase === "drawing" && (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin shrink-0" />
            <p className="text-sm text-gray-400">
              Drawing numbers…{" "}
              <span className="text-white font-bold">
                {revealed.length}/{DRAW_SIZE}
              </span>
            </p>
          </div>
        )}

        {/* Insufficient balance */}
        {phase === "pick" && balance < bet && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">
            Insufficient balance — need {(bet - balance).toLocaleString()} more
            coins
          </div>
        )}

        {/* Play / Reset */}
        {phase === "pick" ? (
          <button
            type="button"
            onClick={play_}
            disabled={picked.size === 0 || balance < bet || isPending}
            className="w-full py-4 rounded-2xl bg-cyan-500 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <GiCoins className="text-base" />
            Play — {bet} coins
          </button>
        ) : phase === "result" ? (
          <button
            type="button"
            onClick={reset}
            className="w-full py-4 rounded-2xl bg-white/[0.08] border border-white/[0.12] text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <FiRefreshCw /> Play Again
          </button>
        ) : null}
      </div>
    </div>
  );
}
