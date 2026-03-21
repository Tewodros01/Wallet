import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  FaCrown,
  FaFire,
  FaGamepad,
  FaGift,
  FaTrophy,
  FaUsers,
  FaWallet,
} from "react-icons/fa";
import {
  FiBell,
  FiChevronRight,
  FiShield,
  FiTarget,
  FiZap,
} from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import CoinCounter from "../components/ui/CoinCounter";
import EmptyState from "../components/ui/EmptyState";
import { BottomNav } from "../components/ui/Layout";
import {
  SkeletonLeaderRow,
  SkeletonRoomCard,
  SkeletonStatCard,
} from "../components/ui/Skeletons";
import LiveRoomCard from "../features/bingo/components/LiveRoomCard";
import { useUnreadCount } from "../hooks/useNotifications";
import { useRooms } from "../hooks/useRooms";
import { useLeaderboard, useMe, useMyStats } from "../hooks/useUser";
import { haptic } from "../lib/haptic";
import { useAuthStore } from "../store/auth.store";
import { useWalletStore } from "../store/wallet.store";
import type {
  GameRoom,
  LeaderboardEntry,
  QuickActionItem,
  StatCardItem,
} from "../types";

const RANK_COLORS = [
  "text-yellow-400",
  "text-gray-300",
  "text-orange-400",
  "text-gray-500",
];
const RANK_BG = [
  "bg-yellow-400/15 border-yellow-400/30",
  "bg-gray-400/10 border-gray-400/20",
  "bg-orange-400/10 border-orange-400/20",
  "bg-white/[0.04] border-white/[0.07]",
];

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { balance, syncFromUser } = useWalletStore();
  const currentUser = useAuthStore((s) => s.user);

  const { data: me, isLoading: meLoading } = useMe();
  const { data: stats, isLoading: statsLoading } = useMyStats();
  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard(4);
  const { data: roomsData, isLoading: roomsLoading } = useRooms({
    status: "all",
  });
  const { data: unreadCount } = useUnreadCount();

  useEffect(() => {
    if (me?.coinsBalance !== undefined) syncFromUser(me.coinsBalance);
  }, [me?.coinsBalance, syncFromUser]);

  const rooms = roomsData ?? [];
  const liveRooms = rooms
    .filter((r: GameRoom) => r.status === "WAITING" || r.status === "PLAYING")
    .slice(0, 4);

  const nav = (path: string) => {
    haptic.light();
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 pt-5 pb-3 bg-gray-950/90 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="relative">
            {meLoading ? (
              <div className="w-11 h-11 rounded-full bg-white/[0.07] animate-pulse" />
            ) : (
              <img
                src={me?.avatar ?? "https://i.pravatar.cc/40"}
                alt="avatar"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-400"
              />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-gray-950 rounded-full" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-semibold">
              Welcome back,
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
          {currentUser?.role === "ADMIN" && (
            <button
              type="button"
              onClick={() => nav("/admin/panel")}
              aria-label="Admin Panel"
              className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center"
            >
              <FiShield className="text-yellow-400 text-sm" />
            </button>
          )}
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
        {/* ── Hero banner ── */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/40 via-emerald-600/20 to-cyan-600/20 border border-white/[0.08] p-5 min-h-[160px] flex flex-col justify-between mt-4"
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <span className="absolute top-4 right-16 text-4xl opacity-20 select-none rotate-12">
            🎱
          </span>
          <span className="absolute bottom-6 right-6 text-5xl opacity-15 select-none -rotate-6">
            🎰
          </span>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-rose-400 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                Live Now
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">
                {rooms.reduce(
                  (s: number, r: GameRoom) => s + (r._count?.players ?? 0),
                  0,
                )}{" "}
                players online
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              Play and <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Win Big.
              </span>
            </h1>
          </div>

          <div className="relative z-10 flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => nav("/game")}
              className="flex items-center gap-2 bg-emerald-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <FaGamepad className="text-base" />
              Play Bingo
            </button>
            <button
              type="button"
              onClick={() => nav("/keno")}
              className="flex items-center gap-2 bg-cyan-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)]"
            >
              <FiZap className="text-base" />
              Play Keno
            </button>
          </div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2.5">
          {statsLoading
            ? [1, 2, 3].map((i) => <SkeletonStatCard key={i} />)
            : (
                [
                  {
                    label: "Games Won",
                    value: stats?.wins ?? "—",
                    icon: <FaTrophy className="text-yellow-400" />,
                    bg: "bg-yellow-400/10 border-yellow-400/20",
                  },
                  {
                    label: "Win Rate",
                    value: stats ? `${stats.winRate}%` : "—",
                    icon: <FaFire className="text-orange-400" />,
                    bg: "bg-orange-400/10 border-orange-400/20",
                  },
                  {
                    label: "Total Games",
                    value: stats?.totalGames ?? "—",
                    icon: <FaUsers className="text-cyan-400" />,
                    bg: "bg-cyan-400/10 border-cyan-400/20",
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

        {/* ── Live rooms ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
              <p className="text-sm font-black text-white">Live Rooms</p>
            </div>
            <button
              type="button"
              onClick={() => nav("/game")}
              title="View all rooms"
              className="flex items-center gap-1 text-xs text-emerald-400 font-bold"
            >
              See all <FiChevronRight aria-hidden="true" />
            </button>
          </div>

          {roomsLoading ? (
            [1, 2].map((i) => <SkeletonRoomCard key={i} />)
          ) : liveRooms.length === 0 ? (
            <EmptyState
              type="rooms"
              title="No live rooms right now"
              subtitle="Create one and invite friends!"
              action={{ label: "Create Room", onClick: () => nav("/game") }}
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {liveRooms.map((room: GameRoom) => (
                <LiveRoomCard
                  key={room.id}
                  room={room}
                  onOpen={(selectedRoom) => nav(`/game/${selectedRoom.id}`)}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Quick actions ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <p className="text-sm font-black text-white">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                {
                  label: "Daily Bonus",
                  sub: "Spin & win coins",
                  icon: <FaGift className="text-emerald-400 text-xl" />,
                  bg: "from-emerald-500/15 to-teal-500/5 border-emerald-500/20",
                  path: "/daily-bonus",
                },
                {
                  label: "My Wallet",
                  sub: `${balance.toLocaleString()} coins`,
                  icon: <FaWallet className="text-teal-400 text-xl" />,
                  bg: "from-teal-500/15 to-cyan-500/5 border-teal-500/20",
                  path: "/wallet",
                },
                {
                  label: "Leaderboard",
                  sub: "Top players",
                  icon: <FaCrown className="text-yellow-400 text-xl" />,
                  bg: "from-yellow-500/15 to-orange-500/5 border-yellow-500/20",
                  path: "/leaderboard",
                },
                {
                  label: "Invite Friends",
                  sub: "Earn 50 coins",
                  icon: <FaUsers className="text-violet-400 text-xl" />,
                  bg: "from-violet-500/15 to-purple-500/5 border-violet-500/20",
                  path: "/invite",
                },
                {
                  label: "Missions",
                  sub: "Daily challenges",
                  icon: <FiTarget className="text-rose-400 text-xl" />,
                  bg: "from-rose-500/15 to-pink-500/5 border-rose-500/20",
                  path: "/missions",
                },
                {
                  label: "Tournament",
                  sub: "Join & win prizes",
                  icon: <FaTrophy className="text-orange-400 text-xl" />,
                  bg: "from-orange-500/15 to-yellow-500/5 border-orange-500/20",
                  path: "/tournament",
                },
              ] as QuickActionItem[]
            ).map(({ label, sub, icon, bg, path }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => nav(path)}
                className={`bg-gradient-to-br ${bg} border rounded-2xl p-4 flex flex-col gap-3 active:scale-95 transition-all text-left`}
              >
                <div
                  className="w-10 h-10 bg-white/[0.06] rounded-xl flex items-center justify-center"
                  aria-hidden="true"
                >
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{label}</p>
                  <p className="text-[11px] text-gray-500">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Leaderboard strip ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-white">Top Players</p>
            <button
              type="button"
              onClick={() => nav("/leaderboard")}
              title="View full leaderboard"
              className="flex items-center gap-1 text-xs text-emerald-400 font-bold"
            >
              See all <FiChevronRight aria-hidden="true" />
            </button>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
            {lbLoading
              ? [1, 2, 3, 4].map((i) => <SkeletonLeaderRow key={i} />)
              : (leaderboard ?? []).map((p: LeaderboardEntry, i: number) => (
                  <button
                    key={p.user?.id ?? i}
                    type="button"
                    onClick={() => nav(`/profile/${p.user?.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3 active:bg-white/[0.06] transition-colors text-left ${i < (leaderboard?.length ?? 0) - 1 ? "border-b border-white/[0.05]" : ""}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${RANK_BG[i] ?? "bg-white/[0.04] border-white/[0.07]"}`}
                    >
                      {i === 0 ? (
                        <FaCrown className="text-yellow-400 text-xs" />
                      ) : (
                        <span
                          className={`text-xs font-black ${RANK_COLORS[i] ?? "text-gray-500"}`}
                        >
                          {p.rank}
                        </span>
                      )}
                    </div>
                    <img
                      src={
                        p.user?.avatar ??
                        `https://i.pravatar.cc/40?u=${p.user?.id}`
                      }
                      alt={p.user?.username}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <p className="flex-1 text-sm font-bold truncate text-white">
                      {p.user?.firstName} {p.user?.lastName}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <GiCoins className="text-yellow-400 text-xs" />
                      <span className="text-xs font-black text-yellow-300">
                        {p.totalEarned.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
            {!lbLoading && !leaderboard?.length && (
              <EmptyState
                type="leaderboard"
                title="No players yet"
                subtitle="Play games to appear here!"
              />
            )}
          </div>
        </motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
