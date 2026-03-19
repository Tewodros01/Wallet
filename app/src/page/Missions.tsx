import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  FaBolt,
  FaCheckCircle,
  FaCoins,
  FaFire,
  FaTrophy,
} from "react-icons/fa";
import { FiArrowLeft, FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonMissionCard } from "../components/ui/Skeletons";
import { useClaimMission, useMissions, useStreak } from "../hooks/useMissions";
import { useGameSound } from "../hooks/useSound";
import { fireConfetti } from "../lib/confetti";
import { haptic } from "../lib/haptic";

const STREAK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STREAK_REWARDS = [20, 30, 50, 75, 100, 150, 300];

function getTodayIndex() {
  return (new Date().getDay() + 6) % 7;
}

export default function Missions() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"DAILY" | "WEEKLY">("DAILY");
  const { play } = useGameSound();

  const { data: missions = [], isLoading } = useMissions(tab);
  const { data: streakData } = useStreak();
  const {
    mutate: claimMission,
    isPending,
    variables: claimingId,
  } = useClaimMission();

  const streak = streakData?.streak ?? 0;
  const todayIdx = getTodayIndex();
  const totalEarnable = missions
    .filter((m) => !m.claimed && m.progress >= m.total)
    .reduce((s, m) => s + m.reward, 0);

  const handleClaim = (id: string) => {
    play("coin");
    haptic.success();
    claimMission(id, {
      onSuccess: () => {
        fireConfetti();
        play("win");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/[0.06] px-5 pt-5 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black text-white">Missions</p>
              <p className="text-[10px] text-gray-500">
                Complete tasks, earn coins
              </p>
            </div>
          </div>
          <AnimatePresence>
            {totalEarnable > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 bg-yellow-400/15 border border-yellow-400/25 rounded-full px-3 py-1.5"
              >
                <FaCoins className="text-yellow-400 text-xs" />
                <span className="text-xs font-black text-yellow-300">
                  +{totalEarnable} ready
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1">
          {(["DAILY", "WEEKLY"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                haptic.light();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                tab === t
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "text-gray-500"
              }`}
            >
              {t === "DAILY" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5 pb-10">
        {/* Streak calendar */}
        <div className="bg-gradient-to-br from-orange-500/15 to-rose-500/5 border border-orange-500/20 rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaFire className="text-orange-400 text-lg" />
              <div>
                <p className="text-sm font-black text-white">
                  {streak} Day Streak 🔥
                </p>
                <p className="text-[10px] text-gray-400">
                  Keep playing daily to earn bonus coins
                </p>
              </div>
            </div>
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl px-3 py-1.5 text-center">
              <p className="text-lg font-black text-orange-400">{streak}</p>
              <p className="text-[9px] text-gray-500">days</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {STREAK_DAYS.map((day, i) => {
              const done = i < streak;
              const isToday = i === todayIdx;
              const future = i > todayIdx;
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2 border transition-all ${
                    isToday
                      ? "bg-orange-500/20 border-orange-500/40"
                      : done
                        ? "bg-emerald-500/15 border-emerald-500/25"
                        : future
                          ? "bg-white/[0.03] border-white/[0.06]"
                          : "bg-rose-500/10 border-rose-500/20"
                  }`}
                >
                  <span className="text-[9px] text-gray-500 font-bold">
                    {day}
                  </span>
                  <span className="text-sm">
                    {done ? "✅" : future ? "🔒" : "❌"}
                  </span>
                  <span
                    className={`text-[8px] font-black ${isToday ? "text-orange-400" : done ? "text-emerald-400" : "text-gray-600"}`}
                  >
                    +{STREAK_REWARDS[i]}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {streak < 7 && (
            <div className="flex items-center gap-3 bg-black/20 rounded-2xl px-4 py-3">
              <span className="text-xl">🎁</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">
                  Day {streak + 1} reward
                </p>
                <p className="text-[10px] text-gray-400">
                  Play tomorrow to claim
                </p>
              </div>
              <div className="flex items-center gap-1">
                <FaCoins className="text-yellow-400 text-xs" />
                <span className="text-sm font-black text-yellow-300">
                  +{STREAK_REWARDS[Math.min(streak, 6)]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Missions list */}
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonMissionCard key={i} />
            ))}
          </div>
        ) : missions.length === 0 ? (
          <EmptyState
            type="missions"
            title="No missions available"
            subtitle="Check back later!"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {missions.map((m, idx) => {
              const done = m.progress >= m.total;
              const pct = Math.min(
                100,
                Math.round((m.progress / m.total) * 100),
              );
              const isClaiming = isPending && claimingId === m.id;

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-white/[0.04] border rounded-2xl p-4 flex items-center gap-3 transition-all ${
                    m.claimed
                      ? "border-white/[0.04] opacity-50"
                      : done
                        ? "border-emerald-500/25"
                        : "border-white/[0.07]"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                      m.claimed
                        ? "bg-white/[0.04]"
                        : done
                          ? "bg-emerald-500/15"
                          : "bg-white/[0.06]"
                    }`}
                  >
                    {m.claimed ? "✅" : m.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p
                        className={`text-sm font-black truncate ${m.claimed ? "text-gray-500" : "text-white"}`}
                      >
                        {m.title}
                      </p>
                      {done && !m.claimed && (
                        <FaBolt className="text-yellow-400 text-xs shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mb-1.5">{m.desc}</p>
                    {!m.claimed && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${done ? "bg-emerald-400" : "bg-blue-400"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 shrink-0">
                          {m.progress}/{m.total}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1">
                      <FaCoins className="text-yellow-400 text-xs" />
                      <span className="text-xs font-black text-yellow-300">
                        +{m.reward}
                      </span>
                    </div>
                    {!m.claimed &&
                      (done ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(m.id)}
                          disabled={isClaiming}
                          className="text-[10px] font-black px-3 py-1.5 rounded-xl transition-all active:scale-95 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] disabled:opacity-60 flex items-center gap-1"
                        >
                          {isClaiming ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <FaCheckCircle /> Claim
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                          <FiLock className="text-[9px]" />
                          <span>{pct}%</span>
                        </div>
                      ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Weekly summary */}
        {tab === "WEEKLY" && missions.length > 0 && (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 grid grid-cols-3 gap-3">
            {[
              {
                icon: <FaTrophy className="text-yellow-400" />,
                label: "Completed",
                value: `${missions.filter((m) => m.claimed).length}/${missions.length}`,
              },
              {
                icon: <FaCoins className="text-emerald-400" />,
                label: "Earned",
                value: `${missions.filter((m) => m.claimed).reduce((s, m) => s + m.reward, 0)}`,
              },
              {
                icon: <FaFire className="text-orange-400" />,
                label: "Streak",
                value: `${streak} days`,
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-base">{icon}</span>
                <p className="text-sm font-black text-white">{value}</p>
                <p className="text-[9px] text-gray-500 uppercase">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
