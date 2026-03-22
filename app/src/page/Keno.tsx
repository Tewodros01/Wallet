import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiRefreshCw, FiZap } from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import { useNavigate, useParams } from "react-router-dom";
import CoinCounter from "../components/ui/CoinCounter";
import { AppBar } from "../components/ui/Layout";
import { APP_ROUTES } from "../config/routes";
import {
  DEFAULT_KENO_STYLE,
  KENO_BETS,
  KENO_DRAW_SIZE,
  KENO_MAX_PICK,
  KENO_PAYOUTS,
  KENO_STYLES,
  KENO_TOTAL,
  type KenoStyle,
} from "../features/keno/config";
import KenoBetSelector from "../features/keno/components/KenoBetSelector";
import KenoNumberGrid from "../features/keno/components/KenoNumberGrid";
import KenoPayoutTable from "../features/keno/components/KenoPayoutTable";
import KenoPickSummary from "../features/keno/components/KenoPickSummary";
import KenoResultBanner from "../features/keno/components/KenoResultBanner";
import { useKenoPlay } from "../features/keno/hooks";
import { shuffle } from "../features/keno/utils";
import { useGameSound } from "../hooks/useSound";
import { fireConfetti } from "../lib/confetti";
import { getErrorMessage } from "../lib/errors";
import { haptic } from "../lib/haptic";
import { toast } from "../store/toast.store";
import { useWalletStore } from "../store/wallet.store";

type Phase = "pick" | "drawing" | "result";

export default function Keno() {
  const navigate = useNavigate();
  const { style: styleParam } = useParams<{ style?: string }>();
  const balance = useWalletStore((s) => s.balance);
  const { mutate: playKeno, isPending } = useKenoPlay();
  const { play } = useGameSound();
  const activeRouteStyle =
    styleParam && styleParam in KENO_STYLES
      ? (styleParam as KenoStyle)
      : DEFAULT_KENO_STYLE;

  const [style, setStyle] = useState<KenoStyle>(activeRouteStyle);
  const [picked, setPicked] = useState<Set<number>>(
    () =>
      new Set(
        shuffle(Array.from({ length: KENO_TOTAL }, (_, i) => i + 1)).slice(
          0,
          KENO_STYLES[activeRouteStyle].picks,
        ),
      ),
  );
  const [bet, setBet] = useState<number>(KENO_STYLES[activeRouteStyle].bet);
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

  useEffect(() => {
    const config = KENO_STYLES[activeRouteStyle];
    setStyle(activeRouteStyle);
    setBet(config.bet);
    setPicked(
      new Set(
        shuffle(Array.from({ length: KENO_TOTAL }, (_, i) => i + 1)).slice(
          0,
          config.picks,
        ),
      ),
    );
    setDrawn([]);
    setRevealed([]);
    setResult(null);
    setPhase("pick");
    clearTimers();
  }, [activeRouteStyle]);

  const toggle = (n: number) => {
    if (phase !== "pick") return;
    setPicked((prev) => {
      const s = new Set(prev);
      if (s.has(n)) {
        s.delete(n);
        haptic.light();
        return s;
      }
      if (s.size >= KENO_MAX_PICK) return s;
      s.add(n);
      haptic.light();
      return s;
    });
  };

  const quickPick = () => {
    if (phase !== "pick") return;
    const count = Math.min(KENO_MAX_PICK, KENO_STYLES[style].picks);
    const picks = shuffle(
      Array.from({ length: KENO_TOTAL }, (_, i) => i + 1),
    ).slice(
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
    setPicked(
      new Set(
        shuffle(Array.from({ length: KENO_TOTAL }, (_, i) => i + 1)).slice(
          0,
          KENO_STYLES[style].picks,
        ),
      ),
    );
    setBet(KENO_STYLES[style].bet);
    setDrawn([]);
    setRevealed([]);
    setResult(null);
    setPhase("pick");
    haptic.light();
  };

  const nums = Array.from({ length: KENO_TOTAL }, (_, i) => i + 1);
  const activeStyle = KENO_STYLES[style];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate(APP_ROUTES.keno)}
              className="w-8 h-8 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black text-white">Keno</p>
              <p className="text-[10px] text-gray-500">
                {activeStyle.label} mode · Draw 20 of 80
              </p>
            </div>
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.kenoHistory)}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              History
            </button>
            <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1.5">
              <CoinCounter value={balance} />
            </div>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <FiZap className="text-cyan-300 text-sm" />
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-4 pb-28">
        {/* Result banner */}
        <AnimatePresence>
          {phase === "result" && result && (
            <KenoResultBanner
              matches={result.matches}
              payout={result.payout}
              picksCount={picked.size}
            />
          )}
        </AnimatePresence>

        <div className="rounded-3xl border border-white/6 bg-white/3 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Active Style
            </p>
            <p className="mt-2 text-lg font-black text-white">{activeStyle.label}</p>
            <p className="mt-1 text-[11px] text-gray-500">
              {activeStyle.sub} Starts with {activeStyle.picks} picks and a {activeStyle.bet}-coin bet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.keno)}
            className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-black text-cyan-300"
          >
            Change Style
          </button>
        </div>

        {/* Number grid */}
        <KenoNumberGrid
          numbers={nums}
          picked={picked}
          drawn={drawn}
          revealed={revealed}
          phase={phase}
          onToggle={toggle}
        />

        {/* Pick counter + Quick Pick */}
        <KenoPickSummary
          picksCount={picked.size}
          maxPick={KENO_MAX_PICK}
          showQuickPick={phase === "pick"}
          onQuickPick={quickPick}
        />

        {/* Bet selector */}
        <KenoBetSelector
          bets={KENO_BETS}
          value={bet}
          disabled={phase !== "pick"}
          onChange={(nextBet) => {
            if (phase !== "pick") return;
            setBet(nextBet);
            haptic.light();
          }}
        />

        {/* Payout table */}
        {picked.size > 0 && phase === "pick" && (
          <KenoPayoutTable
            picksCount={picked.size}
            bet={bet}
            payouts={KENO_PAYOUTS[picked.size]}
          />
        )}

        {/* Drawing animation */}
        {phase === "drawing" && (
          <div className="bg-white/4 border border-white/7 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin shrink-0" />
            <p className="text-sm text-gray-400">
              Drawing numbers…{" "}
              <span className="text-white font-bold">
                {revealed.length}/{KENO_DRAW_SIZE}
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
            className="w-full py-4 rounded-2xl bg-white/8 border border-white/12 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <FiRefreshCw /> Play Again
          </button>
        ) : null}
      </div>

    </div>
  );
}
