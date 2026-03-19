import { FaCoins, FaCrown } from "react-icons/fa";
import { FiActivity, FiArrowLeft, FiDollarSign, FiUser } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useUserTransactions } from "../hooks/useTransactions";
import { useUser } from "../hooks/useUser";
import {
  type Transaction,
  TransactionType,
  getTransactionColor,
  getTransactionSign,
} from "../types";

const AdminUserDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading: userLoading } = useUser(id!);
  const { data: transactions, isLoading: txLoading } = useUserTransactions(id!);

  if (userLoading) {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-3xl bg-white/[0.04] flex items-center justify-center mb-4">
          <FiUser className="text-3xl text-gray-600" />
        </div>
        <p className="text-lg font-bold text-gray-400">User not found</p>
      </div>
    );
  }

  const isBanned = !!user.deletedAt;
  const totalDeposits =
    transactions
      ?.filter((t: Transaction) => t.type === TransactionType.DEPOSIT)
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0;
  const totalWithdrawals =
    transactions
      ?.filter((t: Transaction) => t.type === TransactionType.WITHDRAWAL)
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0;
  const totalWins =
    transactions
      ?.filter((t: Transaction) => t.type === TransactionType.GAME_WIN)
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0;

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
            Admin User Details
          </p>
          <p className="text-[10px] text-gray-500">@{user.username}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.4)]">
          {user.role === "ADMIN" ? (
            <FaCrown className="text-white text-xs" />
          ) : (
            <FiUser className="text-white text-xs" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Hero profile header ── */}
        <div className="relative overflow-hidden px-5 pt-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-indigo-600/8 to-transparent" />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                }
                alt={user.username}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center border-2 border-gray-950">
                {user.role === "ADMIN" ? (
                  <FaCrown className="text-white text-[10px]" />
                ) : (
                  <FiUser className="text-white text-[10px]" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-black text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                {user.role === "AGENT" && (
                  <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                    AGENT
                  </span>
                )}
                {isBanned && (
                  <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                    BANNED
                  </span>
                )}
              </div>
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
                {Number(user.coinsBalance || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* User bio */}
          {user.bio && (
            <div className="relative mt-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                About
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {user.bio}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 px-5 pb-12">
          {/* Balance & Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                icon: <FaCoins />,
                label: "Current Balance",
                value: Number(user.coinsBalance || 0).toLocaleString(),
                from: "from-emerald-500",
                to: "to-teal-500",
                glow: "rgba(16,185,129,0.35)",
              },
              {
                icon: <FiActivity />,
                label: "Total Wins",
                value: totalWins.toLocaleString(),
                from: "from-blue-500",
                to: "to-cyan-500",
                glow: "rgba(59,130,246,0.35)",
              },
              {
                icon: <FiDollarSign />,
                label: "Total Deposits",
                value: totalDeposits.toLocaleString(),
                from: "from-purple-500",
                to: "to-violet-500",
                glow: "rgba(139,92,246,0.35)",
              },
              {
                icon: <FiDollarSign />,
                label: "Total Withdrawals",
                value: totalWithdrawals.toLocaleString(),
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

          {/* Recent Transactions */}
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              Recent Transactions
            </p>

            {txLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-white/[0.04] rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : transactions?.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-700">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                  <FiDollarSign className="text-2xl" />
                </div>
                <p className="text-sm font-semibold">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions?.slice(0, 5).map((tx: Transaction) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-white/[0.04] rounded-xl border border-white/[0.05]"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{tx.title}</p>
                      <p className="text-[11px] text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCoins className="text-yellow-400 text-xs" />
                      <span
                        className={`font-black text-sm ${getTransactionColor(tx.type)}`}
                      >
                        {getTransactionSign(tx.type)}
                        {Number(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
