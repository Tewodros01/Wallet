import { useEffect, useRef, useState } from "react";
import { FaCoins } from "react-icons/fa";
import { FiArrowLeft, FiClock, FiGift } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useClaimDailyBonus } from "../hooks/usePayments";
import { useGameSound } from "../hooks/useSound";
import { fireConfetti } from "../lib/confetti";
import { getErrorMessage } from "../lib/errors";
import { haptic } from "../lib/haptic";
import { useWalletStore } from "../store/wallet.store";

const PRIZES = [
  { label: "50", coins: 50, color: "#10b981", bg: "#064e3b" },
  { label: "200", coins: 200, color: "#f59e0b", bg: "#451a03" },
  { label: "100", coins: 100, color: "#6366f1", bg: "#1e1b4b" },
  { label: "500", coins: 500, color: "#ec4899", bg: "#500724" },
  { label: "75", coins: 75, color: "#14b8a6", bg: "#042f2e" },
  { label: "1000", coins: 1000, color: "#f97316", bg: "#431407" },
  { label: "25", coins: 25, color: "#8b5cf6", bg: "#2e1065" },
  { label: "300", coins: 300, color: "#06b6d4", bg: "#083344" },
];

const STORAGE_KEY = "daily_bonus_last_spin";
const SEGMENT_ANGLE = 360 / PRIZES.length;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function hasSpunRecently() {
  const last = localStorage.getItem(STORAGE_KEY);
  return last ? Date.now() - new Date(last).getTime() < COOLDOWN_MS : false;
}

function getTimeUntilNext() {
  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) return "00:00:00";
  const diff = new Date(last).getTime() + COOLDOWN_MS - Date.now();
  if (diff <= 0) return "00:00:00";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DailyBonus() {
  const navigate = useNavigate();
  const { balance, setBalance } = useWalletStore();
  const { mutate: claimBonus } = useClaimDailyBonus();
  const { play } = useGameSound();

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<(typeof PRIZES)[0] | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [alreadySpin, setAlreadySpin] = useState(hasSpunRecently);
  const [countdown, setCountdown] = useState(getTimeUntilNext);
  const rotRef = useRef(rotation);

  useEffect(() => {
    rotRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (!alreadySpin) return;
    const t = setInterval(() => setCountdown(getTimeUntilNext()), 1000);
    return () => clearInterval(t);
  }, [alreadySpin]);

  const spin = () => {
    if (spinning || alreadySpin) return;
    haptic.medium();
    const idx = Math.floor(Math.random() * PRIZES.length);
    const target = 360 * 8 + (360 - idx * SEGMENT_ANGLE - SEGMENT_ANGLE / 2);
    setSpinning(true);
    setPrize(null);
    setRotation(rotRef.current + target);
    setTimeout(() => {
      setSpinning(false);
      setPrize(PRIZES[idx]);
      play("ding");
      haptic.success();
    }, 4000);
  };

  const claim = () => {
    if (!prize) return;
    play("coin");
    haptic.success();
    claimBonus(undefined, {
      onSuccess: (data: { coins?: number; newBalance?: number }) => {
        const awardedCoins = data.coins ?? prize.coins;
        setPrize((current) =>
          current ? { ...current, coins: awardedCoins, label: String(awardedCoins) } : current,
        );
        setBalance(data.newBalance ?? balance + awardedCoins);
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
        setClaimed(true);
        setAlreadySpin(true);
        play("win");
        haptic.win();
        fireConfetti();
      },
      onError: (err: unknown) => {
        const msg = getErrorMessage(err, "");
        // backend enforces 24h — sync local state if already claimed
        if (msg.includes("Come back in")) {
          localStorage.setItem(STORAGE_KEY, new Date().toISOString());
          setAlreadySpin(true);
        }
      },
    });
  };

  if (claimed && prize)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-5 text-white">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{
            background: prize.bg,
            border: `2px solid ${prize.color}`,
            boxShadow: `0 0 40px ${prize.color}60`,
          }}
        >
          🎉
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400 font-semibold">You won</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <FaCoins className="text-yellow-400 text-2xl" />
            <span className="text-5xl font-black text-yellow-300">
              {prize.coins}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            coins added to your wallet!
          </p>
        </div>
        <div className="w-full bg-white/4 border border-white/7 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">New Balance</span>
          <div className="flex items-center gap-1.5">
            <FaCoins className="text-yellow-400 text-sm" />
            <span className="text-base font-black text-yellow-300">
              {balance.toLocaleString()}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center">
          Come back in 24 hours for another spin!
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/7 flex items-center justify-between px-5 pt-5 pb-3">
        <button
          type="button"
          aria-label="Go back"
          title="Go back"
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
        >
          <FiArrowLeft className="text-white text-sm" />
        </button>
        <span className="text-base font-black">Daily Bonus</span>
        <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1.5">
          <FaCoins className="text-yellow-400 text-xs" />
          <span className="text-yellow-300 text-xs font-black">
            {balance.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 px-5 py-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FiGift className="text-emerald-400 text-xl" />
            <h1 className="text-xl font-black">Spin & Win</h1>
          </div>
          <p className="text-xs text-gray-500">
            One free spin every 24 hours. Don't miss it!
          </p>
        </div>

        {/* Wheel */}
        <div className="relative flex items-center justify-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-white drop-shadow-lg" />
          </div>
          <div
            className="relative w-72 h-72"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 4s cubic-bezier(0.17,0.67,0.12,0.99)"
                : "none",
            }}
          >
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-2xl"
            >
              {PRIZES.map((p, i) => {
                const startAngle = i * SEGMENT_ANGLE - 90,
                  endAngle = startAngle + SEGMENT_ANGLE;
                const s = Math.PI / 180;
                const x1 = 100 + 100 * Math.cos(startAngle * s),
                  y1 = 100 + 100 * Math.sin(startAngle * s);
                const x2 = 100 + 100 * Math.cos(endAngle * s),
                  y2 = 100 + 100 * Math.sin(endAngle * s);
                const mx =
                  100 + 65 * Math.cos((startAngle + SEGMENT_ANGLE / 2) * s);
                const my =
                  100 + 65 * Math.sin((startAngle + SEGMENT_ANGLE / 2) * s);
                const tr = startAngle + SEGMENT_ANGLE / 2;
                return (
                  <g key={p.label}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                      fill={p.bg}
                      stroke="#1f2937"
                      strokeWidth="1"
                    />
                    <text
                      x={mx}
                      y={my}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${tr}, ${mx}, ${my})`}
                      fill={p.color}
                      fontSize="11"
                      fontWeight="900"
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
              <circle
                cx="100"
                cy="100"
                r="18"
                fill="#111827"
                stroke="#374151"
                strokeWidth="2"
              />
              <text
                x="100"
                y="100"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#10b981"
                fontSize="14"
              >
                🎱
              </text>
            </svg>
          </div>
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: "0 0 60px rgba(16,185,129,0.15)" }}
          />
        </div>

        {prize && !claimed && (
          <div className="w-full bg-white/6 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">You landed on</p>
              <div className="flex items-center gap-2 mt-0.5">
                <FaCoins className="text-yellow-400" />
                <span className="text-2xl font-black text-yellow-300">
                  {prize.coins} coins
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={claim}
              className="bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              Claim!
            </button>
          </div>
        )}

        {alreadySpin && !claimed && (
          <div className="w-full bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
            <FiClock className="text-orange-400 text-xl shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">
                Already spun recently
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Next spin in{" "}
                <span className="text-orange-400 font-black">{countdown}</span>
              </p>
            </div>
          </div>
        )}

        {!alreadySpin && (
          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className="w-full bg-emerald-500 disabled:bg-emerald-500/40 text-white font-black py-4 rounded-2xl active:scale-95 transition-all shadow-[0_0_24px_rgba(16,185,129,0.4)] text-lg"
          >
            {spinning ? "Spinning…" : "🎰 Spin Now!"}
          </button>
        )}

        <div className="w-full flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Possible Prizes
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PRIZES.map((p) => (
              <div
                key={p.label}
                className="rounded-xl py-2.5 flex flex-col items-center gap-1"
                style={{ background: p.bg, border: `1px solid ${p.color}30` }}
              >
                <FaCoins style={{ color: p.color }} className="text-xs" />
                <span className="text-xs font-black" style={{ color: p.color }}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
