import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FaCoins, FaGamepad, FaMedal, FaTrophy } from "react-icons/fa";
import {
  FiActivity,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { usersApi } from "../api/users.api";
import { useAuthStore } from "../store/auth.store";

type Tab = "overview" | "stats" | "transactions" | "achievements";

const STATUS_CONFIG: Record<string, { style: string; icon: React.ReactNode }> =
  {
    PENDING: {
      style: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
      icon: <FiClock className="text-[10px]" />,
    },
    PROCESSING: {
      style: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      icon: <FiClock className="text-[10px]" />,
    },
    COMPLETED: {
      style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: <FiCheck className="text-[10px]" />,
    },
    FAILED: {
      style: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      icon: <FiX className="text-[10px]" />,
    },
    REJECTED: {
      style: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      icon: <FiX className="text-[10px]" />,
    },
  };

const achievements = [
  {
    id: 1,
    emoji: "🏆",
    title: "First Win",
    description: "Won your first game",
    unlocked: true,
  },
  {
    id: 2,
    emoji: "🎯",
    title: "Sharp Eye",
    description: "Perfect accuracy in 5 games",
    unlocked: true,
  },
  {
    id: 3,
    emoji: "🔥",
    title: "Hot Streak",
    description: "Won 10 games in a row",
    unlocked: false,
  },
  {
    id: 4,
    emoji: "⚡",
    title: "Speed King",
    description: "Fastest completion time",
    unlocked: true,
  },
  {
    id: 5,
    emoji: "💎",
    title: "Diamond Player",
    description: "Reached diamond tier",
    unlocked: false,
  },
  {
    id: 6,
    emoji: "🎱",
    title: "Bingo Master",
    description: "Won 100 bingo games",
    unlocked: false,
  },
];

type MockTransaction = {
  id: number;
  amount: number;
  method: string;
  status: keyof typeof STATUS_CONFIG;
  type: "deposit" | "withdrawal";
};

function TransactionCard({
  item,
  type,
}: {
  item: MockTransaction;
  type: "deposit" | "withdrawal";
}) {
  const cfg = STATUS_CONFIG[item.status] ?? {
    style: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    icon: null,
  };
  return (
    <div className="bg-white/4 border border-white/7 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-linear-to-br ${type === "deposit" ? "from-emerald-500 to-teal-500" : "from-rose-500 to-pink-500"} flex items-center justify-center`}
          >
            <FiDollarSign className="text-white text-sm" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {type === "deposit" ? "Deposit" : "Withdrawal"}
            </p>
            <p className="text-[11px] text-gray-500">
              {item.method ?? "Bank Transfer"}
            </p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.style}`}
        >
          {cfg.icon} {item.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/4 rounded-xl px-3 py-2.5">
          <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">
            Amount
          </p>
          <p
            className={`text-sm font-black flex items-center gap-1 ${type === "deposit" ? "text-emerald-400" : "text-rose-400"}`}
          >
            <FaCoins className="text-xs opacity-70" />
            {Number(item.amount || 1000).toLocaleString()}
          </p>
        </div>
        <div className="bg-white/4 rounded-xl px-3 py-2.5">
          <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">
            Date
          </p>
          <p className="text-sm font-bold text-white">
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (id === me?.id) {
      navigate("/profile", { replace: true });
    }
  }, [id, me?.id, navigate]);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ["users", id, "stats"],
    queryFn: () => usersApi.getStatsByUserId(id!),
    enabled: !!id,
  });

  if (id === me?.id) {
    return null;
  }

  // Mock transaction data
  const transactions: MockTransaction[] = [
    {
      id: 1,
      type: "deposit",
      amount: 5000,
      status: "COMPLETED",
      method: "Bank Transfer",
    },
    {
      id: 2,
      type: "withdrawal",
      amount: 2500,
      status: "PENDING",
      method: "Mobile Money",
    },
    {
      id: 3,
      type: "deposit",
      amount: 10000,
      status: "COMPLETED",
      method: "Card",
    },
  ];

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "stats", label: "Game Stats" },
    {
      id: "transactions",
      label: "Transactions",
      badge:
        transactions.filter((t) => t.status === "PENDING").length || undefined,
    },
    {
      id: "achievements",
      label: "Achievements",
      badge: achievements.filter((a) => a.unlocked).length || undefined,
    },
  ];

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <div className="px-5 pt-12 pb-6">
          <div className="w-9 h-9 rounded-2xl bg-white/10 mb-5 animate-pulse" />
          <div className="w-40 h-5 bg-white/7 rounded-xl animate-pulse mb-2" />
          <div className="w-24 h-3 bg-white/4 rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-3 px-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-white/4 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-3xl bg-white/4 flex items-center justify-center mb-4">
          <FiUser className="text-3xl text-gray-600" />
        </div>
        <p className="text-lg font-bold text-gray-400">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-5 py-4 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center active:scale-95 transition-all shrink-0"
        >
          <FiArrowLeft className="text-white text-sm" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black text-white leading-tight">
            User Profile
          </p>
          <p className="text-[10px] text-gray-500">@{user.username}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.4)]">
          <FiUser className="text-white text-xs" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Hero profile header ── */}
        <div className="relative overflow-hidden px-5 pt-6 pb-4">
          <div className="absolute inset-0 bg-linear-to-br from-violet-600/15 via-purple-600/8 to-transparent" />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={user.avatar ?? `https://i.pravatar.cc/80?u=${user.id}`}
                alt={user.username}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-linear-to-br from-violet-400 to-purple-500 flex items-center justify-center border-2 border-gray-950">
                <FiUser className="text-white text-[10px]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                @{user.username} · {user.email}
              </p>
              {user.phone && (
                <p className="text-[11px] text-gray-600">{user.phone}</p>
              )}
              <p className="text-[10px] text-gray-600 mt-0.5">
                Since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                Balance
              </p>
              <p className="text-base font-black text-yellow-300 flex items-center gap-1 justify-end mt-0.5">
                <FaCoins className="text-yellow-400 text-xs" />
                {Number(user.coinsBalance ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* User bio */}
          {user.bio && (
            <div className="relative mt-4 bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                About
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {user.bio}
              </p>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 px-5 pb-4 overflow-x-auto no-scrollbar">
          {tabs.map(({ id: tid, label, badge }) => (
            <button
              key={tid}
              type="button"
              onClick={() => setTab(tid)}
              className={`relative flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                tab === tid
                  ? "bg-linear-to-r from-violet-500 to-purple-500 text-white shadow-[0_0_16px_rgba(139,92,246,0.4)]"
                  : "bg-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/8"
              }`}
            >
              {label}
              {badge ? (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 px-5 pb-12">
          {/* ── Overview ── */}
          {tab === "overview" && (
            <>
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    icon: <FaGamepad />,
                    label: "Games Played",
                    value: stats?.totalGames ?? 0,
                    from: "from-blue-500",
                    to: "to-cyan-500",
                    glow: "rgba(59,130,246,0.35)",
                  },
                  {
                    icon: <FiTrendingUp />,
                    label: "Win Rate",
                    value: `${stats?.winRate ?? 0}%`,
                    from: "from-emerald-500",
                    to: "to-teal-500",
                    glow: "rgba(16,185,129,0.35)",
                  },
                  {
                    icon: <FiDollarSign />,
                    label: "Total Earned",
                    value: Number(stats?.totalEarned ?? 0).toLocaleString(),
                    from: "from-yellow-500",
                    to: "to-amber-500",
                    glow: "rgba(245,158,11,0.35)",
                  },
                  {
                    icon: <FiActivity />,
                    label: "Active Days",
                    value: "24",
                    from: "from-violet-500",
                    to: "to-purple-500",
                    glow: "rgba(139,92,246,0.35)",
                  },
                ].map(({ icon, label, value, from, to, glow }) => (
                  <div
                    key={label}
                    className="bg-white/4 border border-white/7 rounded-2xl px-3 py-2.5 flex items-center gap-2.5"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl bg-linear-to-br ${from} ${to} flex items-center justify-center text-white text-xs shrink-0`}
                      style={{ boxShadow: `0 0 12px ${glow}` }}
                    >
                      {icon}
                    </div>
                    <div>
                      <p className="text-base font-black text-white leading-none">
                        {value}
                      </p>
                      <p className="text-[10px] font-bold text-white/70 mt-0.5">
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity chart */}
              <div className="bg-white/4 border border-white/7 rounded-3xl p-5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Recent Activity
                </p>
                <div className="flex items-end gap-1 h-20">
                  {[12, 8, 15, 6, 20, 18, 25, 14, 22, 16, 30, 28, 35, 24].map(
                    (height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-linear-to-t from-violet-500 to-purple-400 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                        style={{ height: `${height}%` }}
                      />
                    ),
                  )}
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-gray-600">
                  <span>2 weeks ago</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Recent achievements */}
              <div className="bg-white/4 border border-white/7 rounded-3xl p-5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Recent Achievements
                </p>
                <div className="flex flex-col gap-3">
                  {achievements
                    .filter((a) => a.unlocked)
                    .slice(0, 3)
                    .map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-3 bg-white/4 rounded-2xl p-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                          {achievement.emoji}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">
                            {achievement.title}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {achievement.description}
                          </p>
                        </div>
                        <FiCheck className="text-emerald-400 text-sm" />
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* ── Game Stats ── */}
          {tab === "stats" && (
            <>
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    icon: <FaGamepad />,
                    label: "Games",
                    value: String(stats?.totalGames ?? 0),
                    color: "text-rose-400",
                  },
                  {
                    icon: <FaTrophy />,
                    label: "Wins",
                    value: String(stats?.wins ?? 0),
                    color: "text-yellow-400",
                  },
                  {
                    icon: <FaMedal />,
                    label: "Win Rate",
                    value: stats ? `${stats.winRate}%` : "0%",
                    color: "text-emerald-400",
                  },
                  {
                    icon: <FaCoins />,
                    label: "Earned",
                    value: stats
                      ? `${Math.floor((stats.totalEarned || 0) / 1000)}k`
                      : "0",
                    color: "text-cyan-400",
                  },
                ].map(({ icon, label, value, color }) => (
                  <div
                    key={label}
                    className="bg-white/4 border border-white/7 rounded-2xl py-3 flex flex-col items-center gap-1"
                  >
                    <span className={`text-base ${color}`}>{icon}</span>
                    <span className="text-base font-black text-white leading-none">
                      {value}
                    </span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Performance breakdown */}
              <div className="bg-white/4 border border-white/7 rounded-3xl p-5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Performance Breakdown
                </p>
                {[
                  {
                    label: "Bingo Games",
                    wins: 45,
                    total: 120,
                    color: "from-emerald-500 to-teal-400",
                  },
                  {
                    label: "Keno Games",
                    wins: 23,
                    total: 80,
                    color: "from-blue-500 to-cyan-400",
                  },
                  {
                    label: "Tournaments",
                    wins: 8,
                    total: 25,
                    color: "from-violet-500 to-purple-400",
                  },
                ].map(({ label, wins, total, color }) => {
                  const percentage = total > 0 ? (wins / total) * 100 : 0;
                  return (
                    <div key={label} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">
                          {label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {wins}/{total}
                        </span>
                      </div>
                      <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-linear-to-r ${color} rounded-full transition-all duration-700`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Transactions ── */}
          {tab === "transactions" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {transactions.length} Transaction
                  {transactions.length !== 1 ? "s" : ""}
                </p>
                {transactions.filter((t) => t.status === "PENDING").length >
                  0 && (
                  <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
                    {transactions.filter((t) => t.status === "PENDING").length}{" "}
                    pending
                  </span>
                )}
              </div>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-gray-700">
                  <div className="w-16 h-16 rounded-3xl bg-white/4 flex items-center justify-center">
                    <FiDollarSign className="text-3xl" />
                  </div>
                  <p className="text-sm font-semibold">No transactions yet</p>
                </div>
              ) : (
                transactions.map((item) => (
                  <TransactionCard
                    key={item.id}
                    item={item}
                    type={item.type as "deposit" | "withdrawal"}
                  />
                ))
              )}
            </>
          )}

          {/* ── Achievements ── */}
          {tab === "achievements" && (
            <>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {achievements.filter((a) => a.unlocked).length}/
                {achievements.length} Unlocked
              </p>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                      achievement.unlocked
                        ? "bg-linear-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/20"
                        : "bg-white/4 border-white/7 opacity-50"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                        achievement.unlocked
                          ? "bg-linear-to-br from-yellow-400 to-orange-500 shadow-[0_0_16px_rgba(245,158,11,0.4)]"
                          : "bg-white/6"
                      }`}
                    >
                      {achievement.emoji}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">
                        {achievement.title}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.unlocked && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <FiCheck className="text-white text-xs" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
