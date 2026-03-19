import { FaCoins } from "react-icons/fa";
import {
  FiActivity,
  FiArrowLeft,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import { useAdminDeposits, useAdminWithdrawals } from "../hooks/usePayments";
import { useAllUsers } from "../hooks/useUser";

export default function AdminPanel() {
  const navigate = useNavigate();

  const { data: users = [], isLoading: usersLoading } = useAllUsers();
  const { data: deposits = [], isLoading: depositsLoading } =
    useAdminDeposits();
  const { data: withdrawals = [], isLoading: withdrawalsLoading } =
    useAdminWithdrawals();

  const agents = users.filter((u: any) => u.role === "AGENT");
  const admins = users.filter((u: any) => u.role === "ADMIN");
  const regular = users.filter((u: any) => u.role === "USER");

  const pendingDeposits = deposits.filter((d: any) => d.status === "PENDING");
  const pendingWithdrawals = withdrawals.filter(
    (w: any) => w.status === "PENDING" || w.status === "PROCESSING",
  );

  const totalDepositCoins = deposits
    .filter((d: any) => d.status === "COMPLETED")
    .reduce((s: number, d: any) => s + Number(d.amount), 0);
  const totalWithdrawalCoins = withdrawals
    .filter((w: any) => w.status === "COMPLETED")
    .reduce((s: number, w: any) => s + Number(w.amount), 0);
  const netFlow = totalDepositCoins - totalWithdrawalCoins;

  const totalPending = pendingDeposits.length + pendingWithdrawals.length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-white leading-tight">Admin Panel</p>
              <p className="text-[10px] text-gray-500">
                {usersLoading ? "Loading…" : `${users.length} users · ${totalPending} pending`}
              </p>
            </div>
          </div>
        }
        right={
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <FiShield className="text-emerald-400 text-sm" />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Header label */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Platform Overview</p>
          <h1 className="text-xl font-black text-white mt-0.5">Welcome back, Admin</h1>
        </div>

        <div className="flex flex-col gap-5 px-5 pb-12">
          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Users",
                value: usersLoading ? "…" : users.length,
                sub: `${agents.length} agents`,
                icon: <FiUsers />,
                from: "from-blue-500",
                to: "to-cyan-500",
                glow: "rgba(59,130,246,0.3)",
              },
              {
                label: "Deposits",
                value: depositsLoading ? "…" : deposits.length,
                sub: `${pendingDeposits.length} pending`,
                icon: <FiTrendingUp />,
                from: "from-emerald-500",
                to: "to-teal-500",
                glow: "rgba(16,185,129,0.3)",
              },
              {
                label: "Withdrawals",
                value: withdrawalsLoading ? "…" : withdrawals.length,
                sub: `${pendingWithdrawals.length} pending`,
                icon: <FiDollarSign />,
                from: "from-orange-500",
                to: "to-amber-500",
                glow: "rgba(249,115,22,0.3)",
              },
              {
                label: "Net Flow",
                value: netFlow.toLocaleString(),
                sub: "completed coins",
                icon: <FiActivity />,
                from: "from-violet-500",
                to: "to-purple-500",
                glow: "rgba(139,92,246,0.3)",
              },
            ].map(({ label, value, sub, icon, from, to, glow }) => (
              <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-3 py-2.5 flex items-center gap-2.5 overflow-hidden">
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white text-xs shrink-0`}
                  style={{ boxShadow: `0 0 10px ${glow}` }}
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-black text-white leading-none">{value}</p>
                  <p className="text-[10px] font-bold text-white/70 leading-tight mt-0.5">{label}</p>
                  <p className="text-[9px] text-gray-500 leading-tight">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Coin flow ── */}
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
                  {totalDepositCoins.toLocaleString()}
                </p>
              </div>
              <div className="flex-1 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3">
                <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">
                  Out
                </p>
                <p className="text-lg font-black text-rose-400 flex items-center gap-1.5">
                  <FaCoins className="text-sm" />
                  {totalWithdrawalCoins.toLocaleString()}
                </p>
              </div>
            </div>
            {/* flow bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden flex">
                {totalDepositCoins + totalWithdrawalCoins > 0 && (
                  <>
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                      style={{
                        width: `${(totalDepositCoins / (totalDepositCoins + totalWithdrawalCoins)) * 100}%`,
                      }}
                    />
                  </>
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

          {/* ── User breakdown ── */}
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              User Breakdown
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "Regular Users",
                  count: regular.length,
                  bar: "bg-gradient-to-r from-blue-500 to-cyan-400",
                  pct: users.length ? (regular.length / users.length) * 100 : 0,
                },
                {
                  label: "Agents",
                  count: agents.length,
                  bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
                  pct: users.length ? (agents.length / users.length) * 100 : 0,
                },
                {
                  label: "Admins",
                  count: admins.length,
                  bar: "bg-gradient-to-r from-yellow-500 to-amber-400",
                  pct: users.length ? (admins.length / users.length) * 100 : 0,
                },
              ].map(({ label, count, bar, pct }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400 font-semibold">
                      {label}
                    </span>
                    <span className="text-xs font-black text-white">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick actions ── */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Quick Actions
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                {
                  icon: <FiUsers />,
                  label: "Manage Users",
                  sub: `${users.length} total`,
                  badge: null,
                  from: "from-blue-500",
                  to: "to-cyan-500",
                  path: "/admin/users",
                },
                {
                  icon: <FiTrendingUp />,
                  label: "Review Deposits",
                  sub: `${deposits.length} total`,
                  badge: pendingDeposits.length,
                  from: "from-emerald-500",
                  to: "to-teal-500",
                  path: "/admin/deposits",
                },
                {
                  icon: <FiDollarSign />,
                  label: "Review Withdrawals",
                  sub: `${withdrawals.length} total`,
                  badge: pendingWithdrawals.length,
                  from: "from-orange-500",
                  to: "to-amber-500",
                  path: "/admin/withdrawals",
                },
                {
                  icon: <FiActivity />,
                  label: "Tournaments",
                  sub: "create & manage",
                  badge: null,
                  from: "from-yellow-500",
                  to: "to-orange-500",
                  path: "/admin/tournaments",
                },
                {
                  icon: <FiClock />,
                  label: "Missions",
                  sub: "create & manage",
                  badge: null,
                  from: "from-violet-500",
                  to: "to-purple-500",
                  path: "/admin/missions",
                },
              ].map(({ icon, label, sub, badge, from, to, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(path)}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all text-left hover:bg-white/[0.07]"
                >
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white text-base shrink-0 shadow-lg`}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-[11px] text-gray-500">{sub}</p>
                  </div>
                  {badge != null && badge > 0 && (
                    <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                      {badge}
                    </span>
                  )}
                  <FiChevronRight className="text-gray-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Agents ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Agents
              </p>
              <button
                type="button"
                onClick={() => navigate("/admin/users")}
                className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold"
              >
                See all <FiChevronRight className="text-xs" />
              </button>
            </div>
            {usersLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-white/[0.04] rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-700">
                <FiShield className="text-3xl" />
                <p className="text-xs font-semibold">No agents yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {agents.slice(0, 3).map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => navigate(`/admin/agents/${u.id}`)}
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-all text-left hover:bg-white/[0.07]"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={u.avatar ?? `https://i.pravatar.cc/40?u=${u.id}`}
                        alt={u.username}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-gray-950 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        @{u.username}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        AGENT
                      </span>
                      <FiChevronRight className="text-gray-600 text-xs" />
                    </div>
                  </button>
                ))}
                {agents.length > 3 && (
                  <button
                    type="button"
                    onClick={() => navigate("/admin/users")}
                    className="text-xs text-gray-600 font-semibold text-center py-2 hover:text-gray-400 transition-colors"
                  >
                    +{agents.length - 3} more agents
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Pending alert ── */}
          {totalPending > 0 && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  pendingDeposits.length > 0
                    ? "/admin/deposits"
                    : "/admin/withdrawals",
                )
              }
              className="w-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center shrink-0">
                <FiClock className="text-yellow-400 text-base" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Action Required</p>
                <p className="text-[11px] text-gray-400">
                  {pendingDeposits.length} deposit
                  {pendingDeposits.length !== 1 ? "s" : ""} ·{" "}
                  {pendingWithdrawals.length} withdrawal
                  {pendingWithdrawals.length !== 1 ? "s" : ""} pending
                </p>
              </div>
              <span className="w-6 h-6 rounded-full bg-yellow-500 text-black text-[10px] font-black flex items-center justify-center shrink-0">
                {totalPending}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
