import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiDollarSign,
  FiGift,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useAgentStats } from "../hooks/useUser";
import type {
  AgentStatsTab,
  AgentStatsTransaction,
  User,
} from "../types";



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

function TxCard({
  item,
  type,
}: {
  item: AgentStatsTransaction;
  type: "deposit" | "withdrawal";
}) {
  const cfg = STATUS_CONFIG[item.status] ?? {
    style: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    icon: null,
  };
  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={
              item.user?.avatar ?? `https://i.pravatar.cc/40?u=${item.user?.id}`
            }
            alt={item.user?.username}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-white">
              {item.user?.firstName} {item.user?.lastName}
            </p>
            <p className="text-[11px] text-gray-500">@{item.user?.username}</p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.style}`}
        >
          {cfg.icon} {item.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/[0.04] rounded-xl px-3 py-2.5">
          <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">
            Amount
          </p>
          <p
            className={`text-sm font-black flex items-center gap-1 ${type === "deposit" ? "text-emerald-400" : "text-rose-400"}`}
          >
            <FaCoins className="text-xs opacity-70" />
            {Number(item.amount).toLocaleString()}
          </p>
        </div>
        <div className="bg-white/[0.04] rounded-xl px-3 py-2.5">
          <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">
            Method
          </p>
          <p className="text-sm font-bold text-white">{item.method ?? "—"}</p>
        </div>
        {type === "withdrawal" && item.accountNumber && (
          <div className="bg-white/[0.04] rounded-xl px-3 py-2.5 col-span-2">
            <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">
              Account
            </p>
            <p className="text-sm font-bold text-white">{item.accountNumber}</p>
          </div>
        )}
        {type === "deposit" && item.reference && (
          <div className="bg-white/[0.04] rounded-xl px-3 py-2.5 col-span-2">
            <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">
              Reference
            </p>
            <p className="text-sm font-bold text-white">{item.reference}</p>
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-600">
        {new Date(item.createdAt).toLocaleString()}
      </p>
    </div>
  );
}

export default function AgentStats() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AgentStatsTab>("overview");

  const { data, isLoading } = useAgentStats(id!);

  const agent = data?.agent;
  const summary = data?.summary;
  const deposits = data?.deposits ?? [];
  const withdrawals = data?.withdrawals ?? [];
  const invited = data?.invitedUsers ?? [];
  const invite = data?.invite;

  const tabs: { id: AgentStatsTab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    {
      id: "deposits",
      label: "Deposits",
      badge: summary?.pendingDeposits || undefined,
    },
    {
      id: "withdrawals",
      label: "Withdrawals",
      badge: summary?.pendingWithdrawals || undefined,
    },
    { id: "users", label: "Users", badge: invited.length || undefined },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <div className="px-5 pt-12 pb-6">
          <div className="w-9 h-9 rounded-2xl bg-white/10 mb-5 animate-pulse" />
          <div className="w-40 h-5 bg-white/[0.07] rounded-xl animate-pulse mb-2" />
          <div className="w-24 h-3 bg-white/[0.04] rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-3 px-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-white/[0.04] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const netFlow =
    (summary?.totalDepositCoins ?? 0) - (summary?.totalWithdrawalCoins ?? 0);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-5 py-4 bg-gray-950/90 backdrop-blur-xl border-b border-white/[0.05]">
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
            Agent Stats
          </p>
          <p className="text-[10px] text-gray-500">@{agent?.username}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)]">
          <FiShield className="text-white text-xs" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Hero profile header ── */}
        <div className="relative overflow-hidden px-5 pt-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/15 via-teal-600/8 to-transparent" />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={agent?.avatar ?? `https://i.pravatar.cc/80?u=${agent?.id}`}
                alt={agent?.username}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center border-2 border-gray-950">
                <FiShield className="text-white text-[10px]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-white truncate">
                {agent?.firstName} {agent?.lastName}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                @{agent?.username} · {agent?.email}
              </p>
              {agent?.phone && (
                <p className="text-[11px] text-gray-600">{agent.phone}</p>
              )}
              <p className="text-[10px] text-gray-600 mt-0.5">
                Since {new Date(agent?.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                Balance
              </p>
              <p className="text-base font-black text-yellow-300 flex items-center gap-1 justify-end mt-0.5">
                <FaCoins className="text-yellow-400 text-xs" />
                {Number(agent?.coinsBalance ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Invite code */}
          {invite && (
            <div className="relative mt-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">
                  Invite Code
                </p>
                <p className="text-base font-black text-violet-300 tracking-[0.2em]">
                  {invite.code}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">
                  Commission
                </p>
                <p className="text-base font-black text-yellow-300 flex items-center gap-1 justify-end">
                  <FaCoins className="text-yellow-400 text-xs" />
                  {Number(invite.commission).toLocaleString()}
                </p>
              </div>
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
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                  : "bg-white/[0.05] text-gray-500 hover:text-gray-300 hover:bg-white/[0.08]"
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
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    icon: <FiUsers />,
                    label: "Invited",
                    value: summary?.totalInvited ?? 0,
                    from: "from-blue-500",
                    to: "to-cyan-500",
                    glow: "rgba(59,130,246,0.35)",
                  },
                  {
                    icon: <FiGift />,
                    label: "Commission",
                    value: Number(invite?.commission ?? 0).toLocaleString(),
                    from: "from-violet-500",
                    to: "to-purple-500",
                    glow: "rgba(139,92,246,0.35)",
                  },
                  {
                    icon: <FiTrendingUp />,
                    label: "Deposits",
                    value: summary?.totalDeposits ?? 0,
                    from: "from-emerald-500",
                    to: "to-teal-500",
                    glow: "rgba(16,185,129,0.35)",
                  },
                  {
                    icon: <FiDollarSign />,
                    label: "Withdrawals",
                    value: summary?.totalWithdrawals ?? 0,
                    from: "from-orange-500",
                    to: "to-amber-500",
                    glow: "rgba(249,115,22,0.35)",
                  },
                ].map(({ icon, label, value, from, to, glow }) => (
                  <div
                    key={label}
                    className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-3 py-2.5 flex items-center gap-2.5"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white text-xs shrink-0`}
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

              {/* Coin flow */}
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Coin Flow
                </p>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">
                      In
                    </p>
                    <p className="text-lg font-black text-emerald-400 flex items-center gap-1.5">
                      <FaCoins className="text-sm" />
                      {Number(summary?.totalDepositCoins ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex-1 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">
                      Out
                    </p>
                    <p className="text-lg font-black text-rose-400 flex items-center gap-1.5">
                      <FaCoins className="text-sm" />
                      {Number(
                        summary?.totalWithdrawalCoins ?? 0,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    {(summary?.totalDepositCoins ?? 0) +
                      (summary?.totalWithdrawalCoins ?? 0) >
                      0 && (
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                        style={{
                          width: `${((summary?.totalDepositCoins ?? 0) / ((summary?.totalDepositCoins ?? 0) + (summary?.totalWithdrawalCoins ?? 0))) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-black ${netFlow >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {netFlow >= 0 ? "+" : ""}
                    {netFlow.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Deposit breakdown */}
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Deposit Breakdown
                </p>
                {(["PENDING", "COMPLETED", "FAILED"] as const).map((s) => {
                  const count = deposits.filter(
                    (d: AgentStatsTransaction) => d.status === s,
                  ).length;
                  const pct = deposits.length
                    ? (count / deposits.length) * 100
                    : 0;
                  const bar =
                    s === "COMPLETED"
                      ? "from-emerald-500 to-teal-400"
                      : s === "PENDING"
                        ? "from-yellow-500 to-amber-400"
                        : "from-rose-500 to-pink-400";
                  return (
                    <div key={s} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_CONFIG[s]?.style}`}
                        >
                          {STATUS_CONFIG[s]?.icon} {s}
                        </span>
                        <span className="text-xs font-black text-white">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${bar} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Withdrawal breakdown */}
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Withdrawal Breakdown
                </p>
                {(
                  ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const
                ).map((s) => {
                  const count = withdrawals.filter(
                    (w: AgentStatsTransaction) => w.status === s,
                  ).length;
                  const pct = withdrawals.length
                    ? (count / withdrawals.length) * 100
                    : 0;
                  const bar =
                    s === "COMPLETED"
                      ? "from-emerald-500 to-teal-400"
                      : s === "PENDING" || s === "PROCESSING"
                        ? "from-yellow-500 to-amber-400"
                        : "from-rose-500 to-pink-400";
                  return (
                    <div key={s} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_CONFIG[s]?.style}`}
                        >
                          {STATUS_CONFIG[s]?.icon} {s}
                        </span>
                        <span className="text-xs font-black text-white">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${bar} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Deposits ── */}
          {tab === "deposits" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {deposits.length} Deposit{deposits.length !== 1 ? "s" : ""}
                </p>
                {(summary?.pendingDeposits ?? 0) > 0 && (
                  <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
                    {summary?.pendingDeposits} pending
                  </span>
                )}
              </div>
              {deposits.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-gray-700">
                  <div className="w-16 h-16 rounded-3xl bg-white/[0.04] flex items-center justify-center">
                    <FaCoins className="text-3xl" />
                  </div>
                  <p className="text-sm font-semibold">No deposits yet</p>
                </div>
              ) : (
                deposits.map((item: AgentStatsTransaction) => (
                  <TxCard key={item.id} item={item} type="deposit" />
                ))
              )}
            </>
          )}

          {/* ── Withdrawals ── */}
          {tab === "withdrawals" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {withdrawals.length} Withdrawal
                  {withdrawals.length !== 1 ? "s" : ""}
                </p>
                {(summary?.pendingWithdrawals ?? 0) > 0 && (
                  <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
                    {summary?.pendingWithdrawals} pending
                  </span>
                )}
              </div>
              {withdrawals.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-gray-700">
                  <div className="w-16 h-16 rounded-3xl bg-white/[0.04] flex items-center justify-center">
                    <FiDollarSign className="text-3xl" />
                  </div>
                  <p className="text-sm font-semibold">No withdrawals yet</p>
                </div>
              ) : (
                withdrawals.map((item: AgentStatsTransaction) => (
                  <TxCard key={item.id} item={item} type="withdrawal" />
                ))
              )}
            </>
          )}

          {/* ── Invited Users ── */}
          {tab === "users" && (
            <>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {invited.length} Invited User{invited.length !== 1 ? "s" : ""}
              </p>
              {invited.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-gray-700">
                  <div className="w-16 h-16 rounded-3xl bg-white/[0.04] flex items-center justify-center">
                    <FiUsers className="text-3xl" />
                  </div>
                  <p className="text-sm font-semibold">No invited users yet</p>
                </div>
              ) : (
                invited.map((u: User) => {
                  const uDeps = deposits.filter(
                    (d: AgentStatsTransaction) => d.user?.id === u.id,
                  );
                  const uWits = withdrawals.filter(
                    (w: AgentStatsTransaction) => w.user?.id === u.id,
                  );
                  const totalDep = uDeps
                    .filter((d: AgentStatsTransaction) => d.status === "COMPLETED")
                    .reduce(
                      (s: number, d: AgentStatsTransaction) => s + Number(d.amount),
                      0,
                    );
                  const totalWit = uWits
                    .filter((w: AgentStatsTransaction) => w.status === "COMPLETED")
                    .reduce(
                      (s: number, w: AgentStatsTransaction) => s + Number(w.amount),
                      0,
                    );
                  return (
                    <div
                      key={u.id}
                      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar ?? `https://i.pravatar.cc/40?u=${u.id}`}
                          alt={u.username}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            @{u.username}
                          </p>
                          <p className="text-[10px] text-gray-600">
                            Joined {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/[0.04] rounded-xl p-2.5 text-center">
                          <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">
                            Txns
                          </p>
                          <p className="text-sm font-black text-white">
                            {uDeps.length + uWits.length}
                          </p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">
                            In
                          </p>
                          <p className="text-sm font-black text-emerald-400">
                            {totalDep.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">
                            Out
                          </p>
                          <p className="text-sm font-black text-rose-400">
                            {totalWit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
