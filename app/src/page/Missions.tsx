import { useState } from "react";
import { FaBolt, FaCheckCircle, FaCoins, FaFire, FaTrophy } from "react-icons/fa";
import { FiArrowLeft, FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface Mission {
  id: string;
  title: string;
  desc: string;
  reward: number;
  progress: number;
  total: number;
  claimed: boolean;
  icon: string;
}

const DAILY: Mission[] = [
  { id: "d1", title: "Play 1 Game",       desc: "Join and complete any bingo room",    reward: 50,  progress: 1, total: 1, claimed: false, icon: "🎮" },
  { id: "d2", title: "Win a Game",        desc: "Get bingo in any room",               reward: 100, progress: 0, total: 1, claimed: false, icon: "🏆" },
  { id: "d3", title: "Play 3 Games",      desc: "Complete 3 bingo games today",        reward: 150, progress: 1, total: 3, claimed: false, icon: "🎯" },
  { id: "d4", title: "Invite a Friend",   desc: "Share your referral link today",      reward: 200, progress: 1, total: 1, claimed: true,  icon: "👥" },
  { id: "d5", title: "Top Up Coins",      desc: "Make any deposit today",              reward: 75,  progress: 0, total: 1, claimed: false, icon: "💳" },
];

const WEEKLY: Mission[] = [
  { id: "w1", title: "Win 5 Games",       desc: "Win 5 bingo games this week",         reward: 500,  progress: 2, total: 5,  claimed: false, icon: "🥇" },
  { id: "w2", title: "Play 20 Games",     desc: "Complete 20 games this week",         reward: 800,  progress: 7, total: 20, claimed: false, icon: "🎲" },
  { id: "w3", title: "Join Tournament",   desc: "Register for any tournament",         reward: 300,  progress: 0, total: 1,  claimed: false, icon: "🏟️" },
  { id: "w4", title: "Invite 3 Friends",  desc: "Get 3 friends to sign up",            reward: 1000, progress: 1, total: 3,  claimed: false, icon: "🤝" },
  { id: "w5", title: "Play Keno",         desc: "Play 5 rounds of Keno",               reward: 400,  progress: 5, total: 5,  claimed: false, icon: "🎰" },
];

// streak: which days this week were logged in (0=Mon … 6=Sun), today = index 3
const STREAK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LOGGED_IN   = [true, true, true, true, false, false, false]; // today = Thu (idx 3)
const TODAY_IDX   = 3;
const STREAK_COUNT = 4;

const STREAK_REWARDS = [
  { day: 1, coins: 20  },
  { day: 2, coins: 30  },
  { day: 3, coins: 50  },
  { day: 4, coins: 75  },
  { day: 5, coins: 100 },
  { day: 6, coins: 150 },
  { day: 7, coins: 300 },
];

export default function Missions() {
  const navigate = useNavigate();
  const [daily, setDaily]   = useState(DAILY);
  const [weekly, setWeekly] = useState(WEEKLY);
  const [tab, setTab]       = useState<"daily" | "weekly">("daily");
  const [claimed, setClaimed] = useState<string | null>(null);

  const claim = (id: string, list: Mission[], setList: typeof setDaily) => {
    setList(list.map((m) => m.id === id ? { ...m, claimed: true } : m));
    setClaimed(id);
    setTimeout(() => setClaimed(null), 1500);
  };

  const missions = tab === "daily" ? daily : weekly;
  const setMissions = tab === "daily" ? setDaily : setWeekly;

  const totalEarnable = missions.filter((m) => !m.claimed && m.progress >= m.total).reduce((s, m) => s + m.reward, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/[0.06] px-5 pt-5 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black text-white">Missions</p>
              <p className="text-[10px] text-gray-500">Complete tasks, earn coins</p>
            </div>
          </div>
          {totalEarnable > 0 && (
            <div className="flex items-center gap-1 bg-yellow-400/15 border border-yellow-400/25 rounded-full px-3 py-1.5">
              <FaCoins className="text-yellow-400 text-xs" />
              <span className="text-xs font-black text-yellow-300">+{totalEarnable} ready</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1">
          {(["daily", "weekly"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                tab === t ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "text-gray-500"
              }`}>
              {t === "daily" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5 pb-10">
        {/* ── Streak calendar ── */}
        <div className="bg-gradient-to-br from-orange-500/15 to-rose-500/5 border border-orange-500/20 rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaFire className="text-orange-400 text-lg" />
              <div>
                <p className="text-sm font-black text-white">{STREAK_COUNT} Day Streak 🔥</p>
                <p className="text-[10px] text-gray-400">Keep playing daily to earn bonus coins</p>
              </div>
            </div>
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl px-3 py-1.5 text-center">
              <p className="text-lg font-black text-orange-400">{STREAK_COUNT}</p>
              <p className="text-[9px] text-gray-500">days</p>
            </div>
          </div>

          {/* Day pills */}
          <div className="grid grid-cols-7 gap-1.5">
            {STREAK_DAYS.map((day, i) => {
              const done    = LOGGED_IN[i];
              const isToday = i === TODAY_IDX;
              const future  = i > TODAY_IDX;
              return (
                <div key={day} className={`flex flex-col items-center gap-1 rounded-xl py-2 border transition-all ${
                  isToday ? "bg-orange-500/20 border-orange-500/40" :
                  done    ? "bg-emerald-500/15 border-emerald-500/25" :
                  future  ? "bg-white/[0.03] border-white/[0.06]" :
                            "bg-rose-500/10 border-rose-500/20"
                }`}>
                  <span className="text-[9px] text-gray-500 font-bold">{day}</span>
                  <span className="text-sm">
                    {done ? "✅" : future ? "🔒" : "❌"}
                  </span>
                  <span className={`text-[8px] font-black ${isToday ? "text-orange-400" : done ? "text-emerald-400" : "text-gray-600"}`}>
                    +{STREAK_REWARDS[i].coins}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Next reward */}
          <div className="flex items-center gap-3 bg-black/20 rounded-2xl px-4 py-3">
            <span className="text-xl">🎁</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">Day {STREAK_COUNT + 1} reward</p>
              <p className="text-[10px] text-gray-400">Play tomorrow to claim</p>
            </div>
            <div className="flex items-center gap-1">
              <FaCoins className="text-yellow-400 text-xs" />
              <span className="text-sm font-black text-yellow-300">+{STREAK_REWARDS[STREAK_COUNT].coins}</span>
            </div>
          </div>
        </div>

        {/* ── Missions list ── */}
        <div className="flex flex-col gap-2.5">
          {missions.map((m) => {
            const done      = m.progress >= m.total;
            const pct       = Math.min(100, Math.round((m.progress / m.total) * 100));
            const isClaimed = claimed === m.id;

            return (
              <div key={m.id} className={`bg-white/[0.04] border rounded-2xl p-4 flex items-center gap-3 transition-all ${
                m.claimed ? "border-white/[0.04] opacity-50" : done ? "border-emerald-500/25" : "border-white/[0.07]"
              }`}>
                {/* Icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                  m.claimed ? "bg-white/[0.04]" : done ? "bg-emerald-500/15" : "bg-white/[0.06]"
                }`}>
                  {m.claimed ? "✅" : m.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className={`text-sm font-black truncate ${m.claimed ? "text-gray-500" : "text-white"}`}>{m.title}</p>
                    {done && !m.claimed && <FaBolt className="text-yellow-400 text-xs shrink-0" />}
                  </div>
                  <p className="text-[10px] text-gray-500 mb-1.5">{m.desc}</p>

                  {/* Progress bar */}
                  {!m.claimed && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${done ? "bg-emerald-400" : "bg-blue-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0">{m.progress}/{m.total}</span>
                    </div>
                  )}
                </div>

                {/* Reward / claim */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-1">
                    <FaCoins className="text-yellow-400 text-xs" />
                    <span className="text-xs font-black text-yellow-300">+{m.reward}</span>
                  </div>
                  {!m.claimed && (
                    done ? (
                      <button type="button" onClick={() => claim(m.id, missions, setMissions)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                          isClaimed ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                        }`}>
                        {isClaimed ? <FaCheckCircle /> : "Claim"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        <FiLock className="text-[9px]" />
                        <span>{pct}%</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly summary */}
        {tab === "weekly" && (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 grid grid-cols-3 gap-3">
            {[
              { icon: <FaTrophy className="text-yellow-400" />, label: "Completed", value: `${weekly.filter((m) => m.claimed).length}/${weekly.length}` },
              { icon: <FaCoins className="text-emerald-400" />, label: "Earned",    value: `${weekly.filter((m) => m.claimed).reduce((s, m) => s + m.reward, 0)}` },
              { icon: <FaFire className="text-orange-400" />,   label: "Streak",    value: `${STREAK_COUNT} days` },
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
