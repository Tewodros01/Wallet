import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  FaCoins,
  FaCrown,
  FaFire,
  FaGamepad,
  FaGift,
  FaTrophy,
  FaUsers,
  FaWallet,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUserTie,
  FaCalendarAlt,
  FaCreditCard,
} from "react-icons/fa";
import {
  FiBell,
  FiChevronRight,
  FiShield,
  FiTarget,
  FiZap,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
} from "react-icons/fi";
import { GiCoins, GiTakeMyMoney } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import { useAgentRequests, useAgentStats, useMe } from "./hooks";
import { APP_ROUTES } from "../../../config/routes";
import { getAvatarInitials, getPublicAssetUrl } from "../../../lib/assets";
import { haptic } from "../../../lib/haptic";
import { useAuthStore } from "../../../store/auth.store";
import { useTheme } from "../../../hooks/useTheme";
import { getThemeClasses } from "../../../lib/theme";
import type {
  AgentDepositRequest,
  AgentWithdrawalRequest,
} from "../../../types/agent-requests.types";
import CoinCounter from "../../components/ui/CoinCounter";
import EmptyState from "../../components/ui/EmptyState";
import { BottomNav } from "../../components/ui/Layout";
import {
  SkeletonLeaderRow,
  SkeletonRoomCard,
  SkeletonStatCard,
} from "../../components/ui/Skeletons";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export default function AgentDashboard() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);

  const { data: me, isLoading: meLoading } = useMe();
  const { data: requests, isLoading: requestsLoading } = useAgentRequests();
  const { data: agentStats, isLoading: statsLoading } = useAgentStats();

  const deposits = requests?.deposits ?? [];
  const withdrawals = requests?.withdrawals ?? [];
  const financialAccounts = me?.financialAccounts ?? [];

  const meAvatar = getPublicAssetUrl(me?.avatar);

  const pendingDeposits = deposits.filter(
    (d: AgentDepositRequest) => d.status === "PENDING",
  ).length;
  const pendingWithdrawals = withdrawals.filter(
    (w: AgentWithdrawalRequest) =>
      w.status === "PENDING" || w.status === "PROCESSING",
  ).length;
  const totalPending = pendingDeposits + pendingWithdrawals;

  const nav = (path: string) => {
    haptic.light();
    navigate(path);
  };

  return (
    <div className={`min-h-screen ${theme.background} ${theme.textPrimary} flex flex-col`}>
      {/* ── Top bar ── */}
      <div className={`sticky top-0 z-40 flex items-center justify-between px-5 pt-5 pb-3 ${isDark ? 'bg-gray-950/90' : 'bg-white/90'} backdrop-blur-xl ${isDark ? 'border-white/5' : 'border-slate-200'} border-b`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            {meLoading ? (
              <div className="w-11 h-11 rounded-full bg-white/7 animate-pulse" />
            ) : meAvatar ? (
              <img
                src={meAvatar}
                alt="avatar"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-yellow-400"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-white/8 ring-2 ring-yellow-400 flex items-center justify-center text-white text-sm font-black">
                {getAvatarInitials(me?.firstName, me?.lastName, "?")}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-400 border-2 border-gray-950 rounded-full" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-semibold">
              Agent Dashboard
            </p>
            <p className="text-base font-black text-white leading-tight">
              {meLoading ? (
                <span className="inline-block w-24 h-4 bg-white/7 rounded animate-pulse" />
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
              onClick={() => nav(APP_ROUTES.admin.panel)}
              aria-label="Admin Panel"
              className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center"
            >
              <FiShield className="text-yellow-400 text-sm" />
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1.5">
            <CoinCounter value={agentStats?.commission ?? 0} />
          </div>
          <button
            type="button"
            aria-label="Notifications"
            title="View notifications"
            onClick={() => nav(APP_ROUTES.notifications)}
            className="w-9 h-9 rounded-full bg-white/6 border border-white/8 flex items-center justify-center relative"
          >
            <FiBell className="text-gray-400 text-sm" aria-hidden="true" />
            {totalPending > 0 && (
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
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-yellow-600/40 via-orange-600/20 to-red-600/20 border border-white/8 p-5 min-h-[160px] flex flex-col justify-between mt-4"
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
          <span className="absolute top-4 right-16 text-4xl opacity-20 select-none rotate-12">
            👑
          </span>
          <span className="absolute bottom-6 right-6 text-5xl opacity-15 select-none -rotate-6">
            💰
          </span>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-yellow-400 uppercase tracking-wider">
                <FaUserTie className="w-3 h-3" />
                Agent Panel
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">
                {totalPending} pending requests
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              Manage & Earn{" "}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-400">
                Commission
              </span>
            </h1>
          </div>

          <div className="relative z-10 flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => nav("/agent-deposits")}
              className="flex items-center gap-2 bg-emerald-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <FaHandHoldingUsd className="text-base" />
              Deposits
            </button>
            <button
              type="button"
              onClick={() => nav("/agent-withdrawals")}
              className="flex items-center gap-2 bg-teal-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(20,184,166,0.35)]"
            >
              <GiTakeMyMoney className="text-base" />
              Withdrawals
            </button>
          </div>
        </motion.div>

        {/* ── Stats strip (4 grid like homepage) ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5">
          {statsLoading || requestsLoading
            ? [1, 2, 3, 4].map((i) => <SkeletonStatCard key={i} />)
            : [
                {
                  label: "Pending",
                  value: totalPending,
                  icon: <FaClock className="text-orange-400" />,
                  bg: "bg-orange-400/10 border-orange-400/20",
                },
                {
                  label: "Total Deposits",
                  value: deposits.length,
                  icon: <FaHandHoldingUsd className="text-emerald-400" />,
                  bg: "bg-emerald-400/10 border-emerald-400/20",
                },
                {
                  label: "Withdrawals",
                  value: withdrawals.length,
                  icon: <GiTakeMyMoney className="text-cyan-400" />,
                  bg: "bg-cyan-400/10 border-cyan-400/20",
                },
                {
                  label: "Commission",
                  value: agentStats?.commission ?? 0,
                  icon: <FaChartLine className="text-yellow-400" />,
                  bg: "bg-yellow-400/10 border-yellow-400/20",
                },
              ].map(({ label, value, icon, bg }) => (
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

        {/* ── Recent Deposits (like Live rooms) ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-sm font-black text-white">Recent Deposits</p>
            </div>
            <button
              type="button"
              onClick={() => nav("/agent-deposits")}
              title="View all deposits"
              className="flex items-center gap-1 text-xs text-emerald-400 font-bold"
            >
              See all <FiChevronRight aria-hidden="true" />
            </button>
          </div>

          {requestsLoading ? (
            [1, 2].map((i) => <SkeletonRoomCard key={i} />)
          ) : deposits.slice(0, 3).length === 0 ? (
            <EmptyState
              type="transactions"
              title="No recent deposits"
              subtitle="Deposit requests will appear here"
              action={{
                label: "View All Deposits",
                onClick: () => nav("/agent-deposits"),
              }}
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {deposits.slice(0, 3).map((deposit: AgentDepositRequest) => (
                <div
                  key={deposit.id}
                  className="bg-white/4 border border-white/7 rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <FaHandHoldingUsd className="text-emerald-400 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">
                      {deposit.user?.firstName} {deposit.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {deposit.method} • @{deposit.user?.username}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="flex items-center gap-1 text-sm font-black text-yellow-300">
                      <GiCoins className="text-xs text-yellow-400" />
                      {deposit.amount.toLocaleString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        deposit.status === "PENDING"
                          ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
                          : deposit.status === "COMPLETED"
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : "text-red-400 bg-red-500/10 border-red-500/20"
                      }`}
                    >
                      {deposit.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Quick actions (like homepage quick actions) ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <p className="text-sm font-black text-white">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                label: "My Account",
                sub: `${financialAccounts.length} accounts`,
                icon: <FaCreditCard className="text-blue-400 text-xl" />,
                bg: "from-blue-500/15 to-indigo-500/5 border-blue-500/20",
                path: "/agent-deposit",
                onClick: () => {
                  navigate("/agent-deposit");
                  // Set tab to accounts after navigation
                  setTimeout(() => {
                    const event = new CustomEvent("setAgentTab", { detail: "accounts" });
                    window.dispatchEvent(event);
                  }, 100);
                },
              },
              {
                label: "Deposits",
                sub: `${pendingDeposits} pending`,
                icon: <FaHandHoldingUsd className="text-emerald-400 text-xl" />,
                bg: "from-emerald-500/15 to-green-500/5 border-emerald-500/20",
                path: "/agent-deposits",
              },
              {
                label: "Withdrawals",
                sub: `${pendingWithdrawals} pending`,
                icon: <GiTakeMyMoney className="text-teal-400 text-xl" />,
                bg: "from-teal-500/15 to-cyan-500/5 border-teal-500/20",
                path: "/agent-withdrawals",
              },
              {
                label: "My Users",
                sub: "Invited users",
                icon: <FaUsers className="text-violet-400 text-xl" />,
                bg: "from-violet-500/15 to-purple-500/5 border-violet-500/20",
                path: APP_ROUTES.invite,
              },
              {
                label: "Earnings",
                sub: `${agentStats?.commission ?? 0} coins`,
                icon: <FaChartLine className="text-yellow-400 text-xl" />,
                bg: "from-yellow-500/15 to-orange-500/5 border-yellow-500/20",
                path: "/agent-deposit",
                onClick: () => {
                  navigate("/agent-deposit");
                  // Set tab to earnings after navigation
                  setTimeout(() => {
                    const event = new CustomEvent("setAgentTab", { detail: "earnings" });
                    window.dispatchEvent(event);
                  }, 100);
                },
              },
              {
                label: "Recent Actions",
                sub: "Activity log",
                icon: <FiActivity className="text-rose-400 text-xl" />,
                bg: "from-rose-500/15 to-pink-500/5 border-rose-500/20",
                path: "/agent-actions",
              },
            ].map(({ label, sub, icon, bg, path, onClick }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => onClick ? onClick() : nav(path)}
                className={`bg-linear-to-br ${bg} border rounded-2xl p-4 flex flex-col gap-3 active:scale-95 transition-all text-left`}
              >
                <div
                  className="w-10 h-10 bg-white/6 rounded-xl flex items-center justify-center"
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

        {/* ── Recent Withdrawals (like Leaderboard strip) ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-white">Recent Withdrawals</p>
            <button
              type="button"
              onClick={() => nav("/agent-withdrawals")}
              title="View all withdrawals"
              className="flex items-center gap-1 text-xs text-teal-400 font-bold"
            >
              See all <FiChevronRight aria-hidden="true" />
            </button>
          </div>
          <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
            {requestsLoading
              ? [1, 2, 3].map((i) => <SkeletonLeaderRow key={i} />)
              : withdrawals.slice(0, 4).length === 0 ? (
                <EmptyState
                  type="transactions"
                  title="No recent withdrawals"
                  subtitle="Withdrawal requests will appear here"
                />
              ) : (
                withdrawals.slice(0, 4).map((withdrawal: AgentWithdrawalRequest, i: number) => (
                  <div
                    key={withdrawal.id}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                      i < Math.min(withdrawals.length, 4) - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl border bg-teal-400/10 border-teal-400/20 flex items-center justify-center shrink-0">
                      <GiTakeMyMoney className="text-teal-400 text-xs" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/8 shrink-0 flex items-center justify-center text-white text-[10px] font-black">
                      {getAvatarInitials(
                        withdrawal.user?.firstName,
                        withdrawal.user?.lastName,
                        "?",
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-white">
                        {withdrawal.user?.firstName} {withdrawal.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {withdrawal.method} • {withdrawal.accountNumber}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1">
                        <GiCoins className="text-yellow-400 text-xs" />
                        <span className="text-xs font-black text-yellow-300">
                          {withdrawal.amount.toLocaleString()}
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          withdrawal.status === "PENDING" || withdrawal.status === "PROCESSING"
                            ? "text-orange-400 bg-orange-500/10"
                            : withdrawal.status === "COMPLETED"
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-red-400 bg-red-500/10"
                        }`}
                      >
                        {withdrawal.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
          </div>
        </motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
}