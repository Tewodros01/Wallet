import { motion } from "framer-motion";
import { useEffect } from "react";
import { FaChartLine, FaCrown, FaHistory } from "react-icons/fa";
import { FiBell, FiChevronRight, FiTrendingUp, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import CoinCounter from "../components/ui/CoinCounter";
import { BottomNav } from "../components/ui/Layout";
import { SkeletonStatCard } from "../components/ui/Skeletons";
import { useUnreadCount } from "../hooks/useNotifications";
import { useMe, useMyStats } from "../hooks/useUser";
import { haptic } from "../lib/haptic";
import { useWalletStore } from "../store/wallet.store";
import type { StatCardItem } from "../types";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const KENO_TABLES = [
  {
    key: "classic",
    label: "Classic Table",
    sub: "Balanced entry and stable pacing",
    accent: "from-cyan-500/15 to-sky-500/5 border-cyan-500/20",
    badge: "Main",
    path: "/keno/play/classic",
  },
  {
    key: "quick",
    label: "Quick Draw",
    sub: "Faster rounds and lighter picks",
    accent: "from-emerald-500/15 to-teal-500/5 border-emerald-500/20",
    badge: "Fast",
    path: "/keno/play/quick",
  },
  {
    key: "highRoller",
    label: "High Stakes",
    sub: "Bigger setup with higher upside",
    accent: "from-amber-500/15 to-orange-500/5 border-amber-500/20",
    badge: "Pro",
    path: "/keno/play/highRoller",
  },
] as const;

export default function KenoDashboard() {
  const navigate = useNavigate();
  const { balance, syncFromUser } = useWalletStore();
  const { data: me, isLoading: meLoading } = useMe();
  const { data: stats, isLoading: statsLoading } = useMyStats();
  const { data: unreadCount } = useUnreadCount();

  useEffect(() => {
    if (me?.coinsBalance !== undefined) syncFromUser(me.coinsBalance);
  }, [me?.coinsBalance, syncFromUser]);

  const nav = (path: string) => {
    haptic.light();
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 pt-5 pb-3 bg-gray-950/90 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="relative">
            {meLoading ? (
              <div className="w-11 h-11 rounded-full bg-white/[0.07] animate-pulse" />
            ) : (
              <img
                src={me?.avatar ?? "https://i.pravatar.cc/40"}
                alt="avatar"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-cyan-400"
              />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-gray-950 rounded-full" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-semibold">
              Ready for a round?
            </p>
            <p className="text-base font-black text-white leading-tight">
              {meLoading ? (
                <span className="inline-block w-24 h-4 bg-white/[0.07] rounded animate-pulse" />
              ) : me ? (
                `${me.firstName} ${me.lastName}`
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1.5">
            <CoinCounter value={balance} />
          </div>
          <button
            type="button"
            aria-label="Notifications"
            title="View notifications"
            onClick={() => nav("/notifications")}
            className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center relative"
          >
            <FiBell className="text-gray-400 text-sm" aria-hidden="true" />
            {(unreadCount?.count ?? 0) > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-gray-950 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-5 px-5 pb-28 overflow-y-auto"
      >
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600/35 via-sky-600/18 to-emerald-600/12 border border-white/[0.08] p-5 min-h-[176px] flex flex-col justify-between mt-4"
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
          <span className="absolute top-4 right-12 text-5xl opacity-15 select-none rotate-6">
            🎰
          </span>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse" />
                Instant Keno
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">
                20 numbers drawn every round
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              Pick fast.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">
                Chase big hits.
              </span>
            </h1>
            <p className="mt-2 text-xs text-gray-400 max-w-[280px]">
              Choose a Keno table, load a preset instantly, and jump straight
              into the detailed game board.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => nav("/keno/play/classic")}
              className="flex items-center gap-2 bg-cyan-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)]"
            >
              <FiZap className="text-base" />
              Start Round
            </button>
            <button
              type="button"
              onClick={() => nav("/keno/history")}
              className="flex items-center gap-2 bg-white/[0.08] border border-white/[0.1] text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all"
            >
              <FaHistory className="text-sm text-cyan-300" />
              History
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2.5">
          {statsLoading
            ? [1, 2, 3].map((i) => <SkeletonStatCard key={i} />)
            : (
                [
                  {
                    label: "Games Won",
                    value: stats?.wins ?? "—",
                    icon: <FaCrown className="text-yellow-400" />,
                    bg: "bg-yellow-400/10 border-yellow-400/20",
                  },
                  {
                    label: "Win Rate",
                    value: stats ? `${stats.winRate}%` : "—",
                    icon: <FiTrendingUp className="text-cyan-300" />,
                    bg: "bg-cyan-400/10 border-cyan-400/20",
                  },
                  {
                    label: "Total Games",
                    value: stats?.totalGames ?? "—",
                    icon: <FaChartLine className="text-emerald-400" />,
                    bg: "bg-emerald-400/10 border-emerald-400/20",
                  },
                ] as StatCardItem[]
              ).map(({ label, value, icon, bg }) => (
                <div
                  key={label}
                  className={`${bg} border rounded-2xl p-3 flex flex-col gap-1.5`}
                >
                  <span className="text-base">{icon}</span>
                  <p className="text-lg font-black text-white leading-none">
                    {String(value)}
                  </p>
                  <p className="text-[10px] text-gray-500 font-semibold">
                    {label}
                  </p>
                </div>
              ))}
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-white">Keno Tables</p>
            <button
              type="button"
              onClick={() => nav("/keno/history")}
              className="flex items-center gap-1 text-xs text-cyan-300 font-bold"
            >
              View rounds <FiChevronRight aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {KENO_TABLES.map((table) => (
              <button
                key={table.key}
                type="button"
                onClick={() => nav(table.path)}
                className={`w-full bg-gradient-to-br ${table.accent} border rounded-2xl p-4 flex items-start gap-3 active:scale-[0.98] transition-all text-left`}
              >
                <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <FiZap className="text-cyan-300 text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-white truncate">
                      {table.label}
                    </p>
                    <span className="text-[10px] font-black text-white/80 bg-white/[0.08] rounded-full px-2 py-1 shrink-0">
                      {table.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{table.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
