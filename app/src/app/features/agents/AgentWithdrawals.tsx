import { motion } from "framer-motion";
import { useState } from "react";
import {
  FaCoins,
  FaWallet,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaHandHoldingUsd,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiBell,
  FiChevronRight,
  FiFilter,
  FiSearch,
} from "react-icons/fi";
import { GiCoins, GiTakeMyMoney } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import {
  useAgentApproveWithdrawal,
  useAgentRejectWithdrawal,
  useAgentRequests,
  useAgentStats,
} from "./hooks";
import { haptic } from "../../../lib/haptic";
import type { AgentWithdrawalRequest } from "../../../types/agent-requests.types";
import EmptyState from "../../components/ui/EmptyState";
import WithdrawalReviewCard from "../payments/components/WithdrawalReviewCard";
import StatusSegmentedFilter from "../payments/components/StatusSegmentedFilter";

const WITHDRAWAL_FILTERS = [
  "all",
  "pending",
  "completed",
  "failed",
  "rejected",
] as const;
type WithdrawalFilter = (typeof WITHDRAWAL_FILTERS)[number];

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export default function AgentWithdrawals() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<WithdrawalFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: requests, isLoading } = useAgentRequests();
  const { data: agentStats } = useAgentStats();

  const { mutate: approveWithdrawal, isPending: approvingW } =
    useAgentApproveWithdrawal();
  const { mutate: rejectWithdrawal, isPending: rejectingW } =
    useAgentRejectWithdrawal();

  const withdrawals = requests?.withdrawals ?? [];
  const pendingCount = withdrawals.filter(
    (w: AgentWithdrawalRequest) =>
      w.status === "PENDING" || w.status === "PROCESSING",
  ).length;

  const filteredWithdrawals = withdrawals
    .filter((w: AgentWithdrawalRequest) =>
      filter === "all" ? true : w.status === filter.toUpperCase(),
    )
    .filter((w: AgentWithdrawalRequest) =>
      searchQuery
        ? w.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    );

  const nav = (path: string) => {
    haptic.light();
    navigate(path);
  };

  const getStatusStats = () => {
    const pending = withdrawals.filter(w => w.status === "PENDING" || w.status === "PROCESSING").length;
    const completed = withdrawals.filter(w => w.status === "COMPLETED").length;
    const failed = withdrawals.filter(w => w.status === "FAILED").length;
    const rejected = withdrawals.filter(w => w.status === "REJECTED").length;
    const total = withdrawals.length;

    return { pending, completed, failed, rejected, total };
  };

  const stats = getStatusStats();

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
              Withdrawal Requests
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
          {pendingCount > 0 && (
            <button
              type="button"
              aria-label="Pending withdrawals"
              className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center relative"
            >
              <FiBell className="text-orange-400 text-sm" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-black text-white">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              </span>
            </button>
          )}
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
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-teal-600/40 via-cyan-600/20 to-blue-600/20 border border-white/8 p-5 min-h-[140px] flex flex-col justify-between mt-4"
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
          <span className="absolute top-4 right-16 text-4xl opacity-20 select-none rotate-12">
            💸
          </span>
          <span className="absolute bottom-6 right-6 text-5xl opacity-15 select-none -rotate-6">
            📤
          </span>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 bg-teal-500/20 border border-teal-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-teal-400 uppercase tracking-wider">
                <GiTakeMyMoney className="w-3 h-3" />
                Withdrawals
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">
                {stats.total} total requests
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              Process Withdrawal{" "}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-400 to-cyan-400">
                Requests
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
              onClick={() => nav("/agent-actions")}
              className="flex items-center gap-2 bg-violet-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)]"
            >
              <span>Recent Actions</span>
              <FiChevronRight className="text-sm" />
            </button>
          </div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5">
          {[
            {
              label: "Pending",
              value: stats.pending,
              icon: <FaClock className="text-orange-400" />,
              bg: "bg-orange-400/10 border-orange-400/20",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: <FaCheckCircle className="text-emerald-400" />,
              bg: "bg-emerald-400/10 border-emerald-400/20",
            },
            {
              label: "Rejected",
              value: stats.rejected,
              icon: <FaTimesCircle className="text-red-400" />,
              bg: "bg-red-400/10 border-red-400/20",
            },
            {
              label: "Total",
              value: stats.total,
              icon: <FaWallet className="text-blue-400" />,
              bg: "bg-blue-400/10 border-blue-400/20",
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
                className="w-full bg-white/4 border border-white/7 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 focus:bg-white/6 transition-all"
              />
            </div>
            <button
              type="button"
              className="w-12 h-12 bg-white/4 border border-white/7 rounded-2xl flex items-center justify-center hover:bg-white/6 transition-colors"
            >
              <FiFilter className="text-gray-400 text-sm" />
            </button>
          </div>

          <StatusSegmentedFilter
            value={filter}
            options={WITHDRAWAL_FILTERS}
            onChange={setFilter}
            compact
          />
        </motion.div>

        {/* ── Withdrawals list ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              <p className="text-sm font-black text-white">
                {filter === "all" ? "All Withdrawals" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Withdrawals`}
              </p>
            </div>
            <span className="text-xs text-gray-500 font-semibold">
              {filteredWithdrawals.length} requests
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white/4 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="rounded-2xl border border-white/7 bg-white/4 min-h-[200px]">
              <EmptyState
                type="transactions"
                title={searchQuery ? "No withdrawals found" : `No ${filter} withdrawals`}
                subtitle={searchQuery ? "Try adjusting your search" : undefined}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredWithdrawals.map((req: AgentWithdrawalRequest) => (
                <div
                  key={req.id}
                  className="transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <WithdrawalReviewCard
                    tone="agent"
                    withdrawal={req}
                    subtitle={`${req.method} · ${req.accountNumber}`}
                    showTimestamp={true}
                    details={
                      (req.status === "PENDING" ||
                        req.status === "PROCESSING") && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-sm text-orange-300">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-orange-400/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                              <FaExclamationTriangle className="text-orange-400 text-sm" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-orange-200 mb-1">Action Required</p>
                              <p className="leading-relaxed">
                                Send{" "}
                                <span className="font-black bg-orange-400/20 px-1.5 py-0.5 rounded">
                                  {req.amount.toLocaleString()} coins
                                </span>{" "}
                                worth of cash to{" "}
                                <span className="font-black">
                                  {req.user?.firstName}
                                </span>{" "}
                                via{" "}
                                <span className="font-black">
                                  {req.method}
                                </span>{" "}
                                ({req.accountNumber}), then approve the request.
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    actionLoading={approvingW || rejectingW}
                    onReject={(id) => {
                      haptic.medium();
                      rejectWithdrawal(id);
                    }}
                    onApprove={(id) => {
                      haptic.success();
                      approveWithdrawal(id);
                    }}
                    approveLabel="Cash Sent & Approve"
                  />
                </div>
              ))}
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
                label: "Recent Actions",
                sub: "View activity log",
                icon: <FaCalendarAlt className="text-violet-400 text-xl" />,
                bg: "from-violet-500/15 to-purple-500/5 border-violet-500/20",
                path: "/agent-actions",
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