import { motion } from "framer-motion";
import { useState } from "react";
import {
  FaCoins,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaHandHoldingUsd,
  FaWallet,
  FaCalendarAlt,
  FaUser,
  FaHistory,
  FaFilter,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiBell,
  FiChevronRight,
  FiSearch,
  FiActivity,
  FiCheck,
  FiX,
  FiClock,
} from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import {
  useAgentRequests,
  useAgentStats,
} from "./hooks";
import { haptic } from "../../../lib/haptic";
import { getAvatarInitials, getPublicAssetUrl } from "../../../lib/assets";
import type { AgentDepositRequest, AgentWithdrawalRequest } from "../../../types/agent-requests.types";
import EmptyState from "../../components/ui/EmptyState";

const ACTION_FILTERS = ["all", "deposits", "withdrawals", "approved", "rejected"] as const;
type ActionFilter = (typeof ACTION_FILTERS)[number];

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

type ActionItem = {
  id: string;
  type: "deposit" | "withdrawal";
  status: string;
  amount: number;
  method?: string;
  accountNumber?: string;
  createdAt: string;
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string | null;
  };
};

export default function AgentActions() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ActionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: requests, isLoading } = useAgentRequests();
  const { data: agentStats } = useAgentStats();

  const deposits = requests?.deposits ?? [];
  const withdrawals = requests?.withdrawals ?? [];

  // Combine and sort all actions by date
  const allActions: ActionItem[] = [
    ...deposits.map((d: AgentDepositRequest) => ({
      id: d.id,
      type: "deposit" as const,
      status: d.status,
      amount: d.amount,
      method: d.method,
      createdAt: d.createdAt || new Date().toISOString(),
      user: d.user,
    })),
    ...withdrawals.map((w: AgentWithdrawalRequest) => ({
      id: w.id,
      type: "withdrawal" as const,
      status: w.status,
      amount: w.amount,
      method: w.method,
      accountNumber: w.accountNumber,
      createdAt: w.createdAt || new Date().toISOString(),
      user: w.user,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredActions = allActions
    .filter((action) => {
      if (filter === "all") return true;
      if (filter === "deposits") return action.type === "deposit";
      if (filter === "withdrawals") return action.type === "withdrawal";
      if (filter === "approved") return action.status === "COMPLETED";
      if (filter === "rejected") return action.status === "REJECTED" || action.status === "FAILED";
      return true;
    })
    .filter((action) =>
      searchQuery
        ? action.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    );

  const nav = (path: string) => {
    haptic.light();
    navigate(path);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <FaCheckCircle className="text-emerald-400" />;
      case "REJECTED":
      case "FAILED":
        return <FaTimesCircle className="text-red-400" />;
      case "PENDING":
      case "PROCESSING":
        return <FaClock className="text-orange-400" />;
      default:
        return <FiClock className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "REJECTED":
      case "FAILED":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "PENDING":
      case "PROCESSING":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getActionStats = () => {
    const totalActions = allActions.length;
    const deposits = allActions.filter(a => a.type === "deposit").length;
    const withdrawals = allActions.filter(a => a.type === "withdrawal").length;
    const approved = allActions.filter(a => a.status === "COMPLETED").length;
    const rejected = allActions.filter(a => a.status === "REJECTED" || a.status === "FAILED").length;

    return { totalActions, deposits, withdrawals, approved, rejected };
  };

  const stats = getActionStats();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 pt-5 pb-3 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            title="Go back"
            onClick={() => {
              haptic.light();
              navigate(-1);
            }}
            className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-all active:scale-95"
          >
            <FiArrowLeft className="text-white text-lg" />
          </button>
          <div>
            <p className="text-[11px] text-gray-500 font-semibold">
              Agent Dashboard
            </p>
            <p className="text-base font-black text-white leading-tight">
              Recent Actions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1.5">
            <GiCoins className="text-yellow-400 text-sm" />
            <span className="text-sm font-black text-yellow-300">
              {agentStats?.commission ?? 0}
            </span>
          </div>
          <button
            type="button"
            aria-label="Activity log"
            className="w-9 h-9 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"
          >
            <FiActivity className="text-violet-400 text-sm" />
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
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600/40 via-purple-600/20 to-indigo-600/20 border border-white/8 p-5 min-h-[140px] flex flex-col justify-between mt-4"
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          <span className="absolute top-4 right-16 text-4xl opacity-20 select-none rotate-12">
            📊
          </span>
          <span className="absolute bottom-6 right-6 text-5xl opacity-15 select-none -rotate-6">
            ⚡
          </span>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 bg-violet-500/20 border border-violet-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-violet-400 uppercase tracking-wider">
                <FiActivity className="w-3 h-3" />
                Activity Log
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">
                {stats.totalActions} total actions
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              Recent Activity &{" "}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-purple-400">
                Action History
              </span>
            </h1>
          </div>

          <div className="relative z-10 flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => nav("/agent-deposits")}
              className="flex items-center gap-2 bg-emerald-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)]"
            >
              <span>Deposits</span>
              <FiChevronRight className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => nav("/agent-withdrawals")}
              className="flex items-center gap-2 bg-teal-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(20,184,166,0.35)]"
            >
              <span>Withdrawals</span>
              <FiChevronRight className="text-sm" />
            </button>
          </div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5">
          {[
            {
              label: "Total Actions",
              value: stats.totalActions,
              icon: <FaHistory className="text-violet-400" />,
              bg: "bg-violet-400/10 border-violet-400/20",
            },
            {
              label: "Approved",
              value: stats.approved,
              icon: <FaCheckCircle className="text-emerald-400" />,
              bg: "bg-emerald-400/10 border-emerald-400/20",
            },
            {
              label: "Deposits",
              value: stats.deposits,
              icon: <FaHandHoldingUsd className="text-blue-400" />,
              bg: "bg-blue-400/10 border-blue-400/20",
            },
            {
              label: "Withdrawals",
              value: stats.withdrawals,
              icon: <FaWallet className="text-teal-400" />,
              bg: "bg-teal-400/10 border-teal-400/20",
            },
          ].map(({ label, value, icon, bg }) => (
            <div
              key={label}
              className={`${bg} border rounded-2xl p-4 flex flex-col gap-2`}
            >
              <span className="text-lg">{icon}</span>
              <p className="text-xl font-black text-white leading-none">
                {String(value)}
              </p>
              <p className="text-[10px] text-gray-500 font-semibold">
                {label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* ── Search and Filter ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search by user name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/4 border border-white/7 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/6 transition-all"
              />
            </div>
            <button
              type="button"
              className="w-12 h-12 bg-white/4 border border-white/7 rounded-2xl flex items-center justify-center hover:bg-white/6 transition-colors"
            >
              <FaFilter className="text-gray-400 text-sm" />
            </button>
          </div>

          <div className="flex gap-1 rounded-2xl border border-white/7 bg-white/4 p-1 overflow-x-auto no-scrollbar">
            {ACTION_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  haptic.light();
                  setFilter(option);
                }}
                className={`flex-shrink-0 px-4 min-w-[80px] py-2.5 rounded-xl text-xs font-bold transition-all touch-action-manipulation ${
                  filter === option
                    ? "bg-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)] scale-105"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5 active:scale-95"
                }`}
              >
                {option === "all"
                  ? "All"
                  : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Actions list ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
              <p className="text-sm font-black text-white">
                {filter === "all" ? "All Actions" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Actions`}
              </p>
            </div>
            <span className="text-xs text-gray-500 font-semibold">
              {filteredActions.length} actions
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-white/4 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="rounded-2xl border border-white/7 bg-white/4 min-h-[200px]">
              <EmptyState
                type="transactions"
                title={searchQuery ? "No actions found" : `No ${filter} actions`}
                subtitle={searchQuery ? "Try adjusting your search" : "Actions will appear here as you process requests"}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredActions.map((action) => {
                const avatarUrl = getPublicAssetUrl(action.user?.avatar);
                return (
                  <div
                    key={action.id}
                    className="bg-white/4 border border-white/7 rounded-2xl p-4 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={action.user?.username ?? ""}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/8 ring-2 ring-white/10 shrink-0 flex items-center justify-center text-white text-xs font-black">
                          {getAvatarInitials(
                            action.user?.firstName,
                            action.user?.lastName,
                            "?",
                          )}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-white">
                            {action.user?.firstName} {action.user?.lastName}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(action.status)}`}>
                            {action.status.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="capitalize">{action.type}</span>
                          <span>•</span>
                          <span>{action.method}</span>
                          {action.accountNumber && (
                            <>
                              <span>•</span>
                              <span>{action.accountNumber}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(action.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(action.status)}
                        </div>
                        <span className="flex items-center gap-1 text-base font-black text-yellow-300">
                          <GiCoins className="text-xs text-yellow-400" />
                          {action.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <p className="text-sm font-black text-white">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                label: "Deposits",
                sub: "Manage deposits",
                icon: <FaHandHoldingUsd className="text-emerald-400 text-xl" />,
                bg: "from-emerald-500/15 to-green-500/5 border-emerald-500/20",
                path: "/agent-deposits",
              },
              {
                label: "Withdrawals",
                sub: "Process withdrawals",
                icon: <FaWallet className="text-teal-400 text-xl" />,
                bg: "from-teal-500/15 to-cyan-500/5 border-teal-500/20",
                path: "/agent-withdrawals",
              },
            ].map(({ label, sub, icon, bg, path }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => nav(path)}
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
      </motion.div>
    </div>
  );
}