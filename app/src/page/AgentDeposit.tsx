import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import { FiArrowLeft, FiCheck, FiClock, FiExternalLink, FiTrendingUp, FiUsers, FiX } from "react-icons/fi";
import { MdOutlineAccountBalanceWallet, MdPictureAsPdf } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import {
  useAgentRequests,
  useAgentApproveDeposit, useAgentRejectDeposit,
  useAgentApproveWithdrawal, useAgentRejectWithdrawal,
} from "../hooks/usePayments";
import { useAgentStats } from "../hooks/useAgents";

type Tab = "deposits" | "withdrawals" | "users" | "earnings";

const statusStyle: Record<string, string> = {
  PENDING:    "bg-orange-500/15 text-orange-400 border-orange-500/30",
  COMPLETED:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  FAILED:     "bg-rose-500/15 text-rose-400 border-rose-500/30",
  PROCESSING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "deposits",    label: "Deposits",    icon: <MdOutlineAccountBalanceWallet /> },
  { id: "withdrawals", label: "Withdrawals", icon: <FiTrendingUp /> },
  { id: "users",       label: "My Users",    icon: <FiUsers /> },
  { id: "earnings",    label: "Earnings",    icon: <FaCoins /> },
];

export default function AgentDeposit() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("deposits");
  const [dFilter, setDFilter] = useState<string>("all");
  const [wFilter, setWFilter] = useState<string>("all");

  const { data: requests, isLoading } = useAgentRequests();
  const { data: agentStats } = useAgentStats();

  const { mutate: approveDeposit,    isPending: approvingD } = useAgentApproveDeposit();
  const { mutate: rejectDeposit,     isPending: rejectingD  } = useAgentRejectDeposit();
  const { mutate: approveWithdrawal, isPending: approvingW  } = useAgentApproveWithdrawal();
  const { mutate: rejectWithdrawal,  isPending: rejectingW  } = useAgentRejectWithdrawal();

  const deposits    = requests?.deposits    ?? [];
  const withdrawals = requests?.withdrawals ?? [];

  const pendingD = deposits.filter((d: any) => d.status === "PENDING").length;
  const pendingW = withdrawals.filter((w: any) => w.status === "PENDING" || w.status === "PROCESSING").length;
  const totalPending = pendingD + pendingW;

  const filteredD = dFilter === "all" ? deposits : deposits.filter((d: any) => d.status === dFilter.toUpperCase());
  const filteredW = wFilter === "all" ? withdrawals : withdrawals.filter((w: any) => w.status === wFilter.toUpperCase());

  const invitedUsers = agentStats ? [] : []; // users come from invite system

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <span className="text-base font-black">Agent Panel</span>
          </div>
        }
        right={totalPending > 0 ? (
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-black text-white">{totalPending}</span>
          </div>
        ) : undefined}
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-10">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Pending",  value: totalPending,                    color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20"   },
            { label: "Deposits", value: deposits.length,                 color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Withdraw", value: withdrawals.length,              color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20"       },
            { label: "Earned",   value: agentStats?.commission ?? 0,     color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20"   },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} border rounded-2xl py-3 flex flex-col items-center gap-1`}>
              <span className={`text-base font-black ${color}`}>{value}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1.5">
          {TABS.map(({ id, label, icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${tab === id ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "text-gray-500 hover:text-gray-300"}`}>
              <span className="text-sm">{icon}</span>{label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/[0.04] rounded-2xl animate-pulse" />)}</div>
        ) : (
          <>
            {/* Deposits tab */}
            {tab === "deposits" && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  {["all", "pending", "completed", "failed"].map((f) => (
                    <button key={f} type="button" onClick={() => setDFilter(f)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all ${dFilter === f ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-gray-400 hover:bg-white/10"}`}>
                      {f}{f === "pending" && pendingD > 0 ? ` (${pendingD})` : ""}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  {filteredD.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-gray-600"><FiClock className="text-3xl" /><p className="text-sm font-semibold">No {dFilter} deposits</p></div>
                  ) : filteredD.map((req: any) => (
                    <div key={req.id} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <img src={req.user?.avatar ?? `https://i.pravatar.cc/40?u=${req.userId}`} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{req.user?.firstName} {req.user?.lastName}</p>
                          <p className="text-[11px] text-gray-500">@{req.user?.username} · {req.method}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="flex items-center gap-1 text-base font-black text-yellow-300"><FaCoins className="text-xs text-yellow-400" />{req.amount.toLocaleString()}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[req.status] ?? ""}`}>{req.status}</span>
                        </div>
                      </div>
                      {/* Payment proof */}
                      {req.proofUrl && (
                        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-2.5 flex flex-col gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Payment Proof</p>
                          {req.proofUrl.startsWith("data:image") ? (
                            <img src={req.proofUrl} alt="proof" className="w-full max-h-48 object-contain rounded-lg border border-white/10" />
                          ) : req.proofUrl.startsWith("data:application/pdf") ? (
                            <div className="flex items-center gap-2 text-rose-400">
                              <MdPictureAsPdf className="text-2xl shrink-0" />
                              <span className="text-xs font-semibold">PDF Document attached</span>
                            </div>
                          ) : (
                            <a href={req.proofUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 text-emerald-400 text-xs font-semibold hover:text-emerald-300 transition-colors truncate">
                              <FiExternalLink className="shrink-0" />
                              <span className="truncate">{req.proofUrl}</span>
                            </a>
                          )}
                        </div>
                      )}
                      {req.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => rejectDeposit(req.id)} disabled={rejectingD}
                            className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-500/20 active:scale-95 transition-all disabled:opacity-50">
                            <FiX /> Reject
                          </button>
                          <button type="button" onClick={() => approveDeposit(req.id)} disabled={approvingD}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-500/25 active:scale-95 transition-all disabled:opacity-50">
                            <FiCheck /> Approve
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Withdrawals tab */}
            {tab === "withdrawals" && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  {["all", "pending", "completed", "failed"].map((f) => (
                    <button key={f} type="button" onClick={() => setWFilter(f)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all ${wFilter === f ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-gray-400 hover:bg-white/10"}`}>
                      {f}{f === "pending" && pendingW > 0 ? ` (${pendingW})` : ""}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  {filteredW.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-gray-600"><FiClock className="text-3xl" /><p className="text-sm font-semibold">No {wFilter} withdrawals</p></div>
                  ) : filteredW.map((req: any) => (
                    <div key={req.id} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <img src={req.user?.avatar ?? `https://i.pravatar.cc/40?u=${req.userId}`} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{req.user?.firstName} {req.user?.lastName}</p>
                          <p className="text-[11px] text-gray-500">{req.method} · {req.accountNumber}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="flex items-center gap-1 text-base font-black text-yellow-300"><FaCoins className="text-xs text-yellow-400" />{req.amount.toLocaleString()}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[req.status] ?? ""}`}>{req.status}</span>
                        </div>
                      </div>
                      {(req.status === "PENDING" || req.status === "PROCESSING") && (
                        <div className="flex flex-col gap-2">
                          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 text-xs text-orange-300">
                            Send <span className="font-black">{req.amount.toLocaleString()} coins</span> worth of cash to <span className="font-black">{req.user?.firstName}</span> via <span className="font-black">{req.method}</span> ({req.accountNumber}), then approve.
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => rejectWithdrawal(req.id)} disabled={rejectingW}
                              className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-500/20 active:scale-95 transition-all disabled:opacity-50">
                              <FiX /> Reject
                            </button>
                            <button type="button" onClick={() => approveWithdrawal(req.id)} disabled={approvingW}
                              className="flex-1 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-500/25 active:scale-95 transition-all disabled:opacity-50">
                              <FiCheck /> Cash Sent & Approve
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users tab — from invite system */}
            {tab === "users" && (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-600">
                <FiUsers className="text-3xl" />
                <p className="text-sm font-semibold">View invited users in the Invite page</p>
                <button type="button" onClick={() => navigate("/invite")} className="text-xs text-emerald-400 font-bold">Go to Invite →</button>
              </div>
            )}

            {/* Earnings tab */}
            {tab === "earnings" && (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total Commission Earned</p>
                    <div className="flex items-center gap-2 mt-1">
                      <FaCoins className="text-yellow-400 text-lg" />
                      <span className="text-2xl font-black text-yellow-300">{agentStats?.commission ?? 0}</span>
                      <span className="text-xs text-gray-500">coins</span>
                    </div>
                  </div>
                  <FiTrendingUp className="text-yellow-400 text-3xl" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-2">
                  <p className="text-xs text-gray-400">You earn <span className="text-yellow-300 font-bold">50 coins</span> for each user who signs up with your referral code.</p>
                  <button type="button" onClick={() => navigate("/invite")} className="text-xs text-emerald-400 font-bold text-left">View your invite code →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
