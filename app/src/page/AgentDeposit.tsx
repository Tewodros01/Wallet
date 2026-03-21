import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import {
  FiArrowLeft,
  FiClock,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ProofViewerSheet from "../components/payment/ProofViewerSheet";
import { AppBar } from "../components/ui/Layout";
import DepositReviewCard from "../features/payments/components/DepositReviewCard";
import WithdrawalReviewCard from "../features/payments/components/WithdrawalReviewCard";
import { useAgentStats } from "../hooks/useAgents";
import {
  useAgentApproveDeposit,
  useAgentApproveWithdrawal,
  useAgentRejectDeposit,
  useAgentRejectWithdrawal,
  useAgentRequests,
} from "../hooks/usePayments";
import type {
  AgentDepositRequest,
  AgentWithdrawalRequest,
} from "../types/agent-requests.types";

type Tab = "deposits" | "withdrawals" | "users" | "earnings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "deposits",
    label: "Deposits",
    icon: <MdOutlineAccountBalanceWallet />,
  },
  { id: "withdrawals", label: "Withdrawals", icon: <FiTrendingUp /> },
  { id: "users", label: "My Users", icon: <FiUsers /> },
  { id: "earnings", label: "Earnings", icon: <FaCoins /> },
];

export default function AgentDeposit() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("deposits");
  const [dFilter, setDFilter] = useState<string>("all");
  const [wFilter, setWFilter] = useState<string>("all");
  const [proofSheet, setProofSheet] = useState<{
    url: string;
  } | null>(null);

  const { data: requests, isLoading } = useAgentRequests();
  const { data: agentStats } = useAgentStats();

  const { mutate: approveDeposit, isPending: approvingD } =
    useAgentApproveDeposit();
  const { mutate: rejectDeposit, isPending: rejectingD } =
    useAgentRejectDeposit();
  const { mutate: approveWithdrawal, isPending: approvingW } =
    useAgentApproveWithdrawal();
  const { mutate: rejectWithdrawal, isPending: rejectingW } =
    useAgentRejectWithdrawal();

  const deposits = requests?.deposits ?? [];
  const withdrawals = requests?.withdrawals ?? [];

  const pendingD = deposits.filter(
    (d: AgentDepositRequest) => d.status === "PENDING",
  ).length;
  const pendingW = withdrawals.filter(
    (w: AgentWithdrawalRequest) =>
      w.status === "PENDING" || w.status === "PROCESSING",
  ).length;
  const totalPending = pendingD + pendingW;

  const filteredD =
    dFilter === "all"
      ? deposits
      : deposits.filter(
          (d: AgentDepositRequest) => d.status === dFilter.toUpperCase(),
        );
  const filteredW =
    wFilter === "all"
      ? withdrawals
      : withdrawals.filter(
          (w: AgentWithdrawalRequest) => w.status === wFilter.toUpperCase(),
        );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <span className="text-base font-black">Agent Panel</span>
          </div>
        }
        right={
          totalPending > 0 ? (
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-black text-white">
                {totalPending}
              </span>
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-10">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: "Pending",
              value: totalPending,
              color: "text-orange-400",
              bg: "bg-orange-500/10 border-orange-500/20",
            },
            {
              label: "Deposits",
              value: deposits.length,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              label: "Withdraw",
              value: withdrawals.length,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10 border-cyan-500/20",
            },
            {
              label: "Earned",
              value: agentStats?.commission ?? 0,
              color: "text-yellow-400",
              bg: "bg-yellow-500/10 border-yellow-500/20",
            },
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              className={`${bg} border rounded-2xl py-3 flex flex-col items-center gap-1`}
            >
              <span className={`text-base font-black ${color}`}>{value}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1.5">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${tab === id ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "text-gray-500 hover:text-gray-300"}`}
            >
              <span className="text-sm">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/[0.04] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Deposits tab */}
            {tab === "deposits" && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  {["all", "pending", "completed", "failed"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setDFilter(f)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all ${dFilter === f ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-gray-400 hover:bg-white/10"}`}
                    >
                      {f}
                      {f === "pending" && pendingD > 0 ? ` (${pendingD})` : ""}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  {filteredD.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-gray-600">
                      <FiClock className="text-3xl" />
                      <p className="text-sm font-semibold">
                        No {dFilter} deposits
                      </p>
                    </div>
                  ) : (
                    filteredD.map((req: AgentDepositRequest) => {
                      return (
                        <DepositReviewCard
                          key={req.id}
                          deposit={req}
                          subtitle={`@${req.user?.username ?? "unknown"} · ${req.method}`}
                          actionLoading={approvingD || rejectingD}
                          onShowProof={(url) =>
                            setProofSheet({
                              url,
                            })
                          }
                          onReject={(id) => rejectDeposit(id)}
                          onApprove={(id) => approveDeposit(id)}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Withdrawals tab */}
            {tab === "withdrawals" && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  {["all", "pending", "completed", "failed"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setWFilter(f)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all ${wFilter === f ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-gray-400 hover:bg-white/10"}`}
                    >
                      {f}
                      {f === "pending" && pendingW > 0 ? ` (${pendingW})` : ""}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  {filteredW.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-gray-600">
                      <FiClock className="text-3xl" />
                      <p className="text-sm font-semibold">
                        No {wFilter} withdrawals
                      </p>
                    </div>
                  ) : (
                    filteredW.map((req: AgentWithdrawalRequest) => (
                      <WithdrawalReviewCard
                        key={req.id}
                        tone="agent"
                        withdrawal={req}
                        subtitle={`${req.method} · ${req.accountNumber}`}
                        details={
                          (req.status === "PENDING" ||
                            req.status === "PROCESSING") && (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 text-xs text-orange-300">
                              Send{" "}
                              <span className="font-black">
                                {req.amount.toLocaleString()} coins
                              </span>{" "}
                              worth of cash to{" "}
                              <span className="font-black">
                                {req.user?.firstName}
                              </span>{" "}
                              via{" "}
                              <span className="font-black">{req.method}</span> (
                              {req.accountNumber}), then approve.
                            </div>
                          )
                        }
                        actionLoading={approvingW || rejectingW}
                        onReject={(id) => rejectWithdrawal(id)}
                        onApprove={(id) => approveWithdrawal(id)}
                        approveLabel="Cash Sent & Approve"
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Users tab — from invite system */}
            {tab === "users" && (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-600">
                <FiUsers className="text-3xl" />
                <p className="text-sm font-semibold">
                  View invited users in the Invite page
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/invite")}
                  className="text-xs text-emerald-400 font-bold"
                >
                  Go to Invite →
                </button>
              </div>
            )}

            {/* Earnings tab */}
            {tab === "earnings" && (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Total Commission Earned
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <FaCoins className="text-yellow-400 text-lg" />
                      <span className="text-2xl font-black text-yellow-300">
                        {agentStats?.commission ?? 0}
                      </span>
                      <span className="text-xs text-gray-500">coins</span>
                    </div>
                  </div>
                  <FiTrendingUp className="text-yellow-400 text-3xl" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-2">
                  <p className="text-xs text-gray-400">
                    You earn{" "}
                    <span className="text-yellow-300 font-bold">50 coins</span>{" "}
                    for each user who signs up with your referral code.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/invite")}
                    className="text-xs text-emerald-400 font-bold text-left"
                  >
                    View your invite code →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ProofViewerSheet
        open={!!proofSheet}
        url={proofSheet?.url ?? null}
        onClose={() => setProofSheet(null)}
      />
    </div>
  );
}
