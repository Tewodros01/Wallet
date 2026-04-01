import { motion } from "framer-motion";
import { useState } from "react";
import {
  FaCoins,
  FaHandHoldingUsd,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaUser,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiBell,
  FiChevronRight,
  FiFilter,
  FiSearch,
} from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import {
  useAgentApproveDeposit,
  useAgentRejectDeposit,
  useAgentRequests,
  useAgentStats,
} from "./hooks";
import { haptic } from "../../../lib/haptic";
import type { AgentDepositRequest } from "../../../types/agent-requests.types";
import ProofViewerSheet from "../../components/payment/ProofViewerSheet";
import EmptyState from "../../components/ui/EmptyState";
import DepositReviewCard from "../payments/components/DepositReviewCard";
import StatusSegmentedFilter from "../payments/components/StatusSegmentedFilter";

const DEPOSIT_FILTERS = ["all", "pending", "completed", "failed"] as const;
type DepositFilter = (typeof DEPOSIT_FILTERS)[number];

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export default function AgentDeposits() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<DepositFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [proofSheet, setProofSheet] = useState<{
    url: string;
  } | null>(null);

  const { data: requests, isLoading } = useAgentRequests();
  const { data: agentStats } = useAgentStats();

  const { mutate: approveDeposit, isPending: approvingD } =
    useAgentApproveDeposit();
  const { mutate: rejectDeposit, isPending: rejectingD } =
    useAgentRejectDeposit();

  const deposits = requests?.deposits ?? [];
  const pendingCount = deposits.filter(
    (d: AgentDepositRequest) => d.status === "PENDING",
  ).length;

  const filteredDeposits = deposits
    .filter((d: AgentDepositRequest) =>
      filter === "all" ? true : d.status === filter.toUpperCase(),
    )
    .filter((d: AgentDepositRequest) =>
      searchQuery
        ? d.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    );

  const nav = (path: string) => {
    haptic.light();
    navigate(path);
  };

  const getStatusStats = () => {
    const pending = deposits.filter(d => d.status === "PENDING").length;
    const completed = deposits.filter(d => d.status === "COMPLETED").length;
    const failed = deposits.filter(d => d.status === "FAILED").length;
    const total = deposits.length;

    return { pending, completed, failed, total };
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
              Deposit Requests
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
              aria-label="Pending deposits"
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
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600/40 via-green-600/20 to-teal-600/20 border border-white/8 p-5 min-h-[140px] flex flex-col justify-between mt-4"
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-500/20 rounded-full blur-2xl pointer-events-none" />
          <span className="absolute top-4 right-16 text-4xl opacity-20 select-none rotate-12">
            💰
          </span>
          <span className="absolute bottom-6 right-6 text-5xl opacity-15 select-none -rotate-6">
            📥
          </span>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                <FaHandHoldingUsd className="w-3 h-3" />
                Deposits
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">
                {stats.total} total requests
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              Manage Deposit{" "}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-green-400">
                Requests
              </span>
            </h1>
          </div>

          <div className="relative z-10 flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => nav("/agent-withdrawals")}
              className="flex items-center gap-2 bg-teal-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(20,184,166,0.35)]"
            >
              <span>Withdrawals</span>
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
              label: "Failed",
              value: stats.failed,
              icon: <FaTimesCircle className="text-red-400" />,
              bg: "bg-red-400/10 border-red-400/20",
            },
            {
              label: "Total",
              value: stats.total,
              icon: <FaHandHoldingUsd className="text-blue-400" />,
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
                className="w-full bg-white/4 border border-white/7 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/6 transition-all"
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
            options={DEPOSIT_FILTERS}
            onChange={setFilter}
          />
        </motion.div>

        {/* ── Deposits list ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-sm font-black text-white">
                {filter === "all" ? "All Deposits" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Deposits`}
              </p>
            </div>
            <span className="text-xs text-gray-500 font-semibold">
              {filteredDeposits.length} requests
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
          ) : filteredDeposits.length === 0 ? (
            <div className="rounded-2xl border border-white/7 bg-white/4 min-h-[200px]">
              <EmptyState
                type="transactions"
                title={searchQuery ? "No deposits found" : `No ${filter} deposits`}
                subtitle={searchQuery ? "Try adjusting your search" : undefined}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredDeposits.map((req: AgentDepositRequest) => (
                <div
                  key={req.id}
                  className="transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <DepositReviewCard
                    deposit={req}
                    subtitle={`@${req.user?.username ?? "unknown"} · ${req.method}`}
                    actionLoading={approvingD || rejectingD}
                    showTimestamp={true}
                    onShowProof={(url) =>
                      setProofSheet({
                        url,
                      })
                    }
                    onReject={(id) => {
                      haptic.medium();
                      rejectDeposit(id);
                    }}
                    onApprove={(id) => {
                      haptic.success();
                      approveDeposit(id);
                    }}
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
                label: "Withdrawals",
                sub: "Manage withdrawals",
                icon: <FaCoins className="text-teal-400 text-xl" />,
                bg: "from-teal-500/15 to-cyan-500/5 border-teal-500/20",
                path: "/agent-withdrawals",
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

      <ProofViewerSheet
        open={!!proofSheet}
        url={proofSheet?.url ?? null}
        onClose={() => setProofSheet(null)}
      />
    </div>
  );
}