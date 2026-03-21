import { useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp, FaCoins, FaExchangeAlt, FaMoneyCheckAlt } from "react-icons/fa";
import { FiClock, FiGrid } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar, Avatar, BottomNav } from "../components/ui/Layout";
import { useDeposits, useWithdrawals } from "../hooks/usePayments";
import { useTransactions } from "../hooks/useTransactions";
import { useMe } from "../hooks/useUser";
import { useWalletStore } from "../store/wallet.store";
import type {
  ActivityItem,
  Deposit,
  WalletActivityStatus,
  StatusBadgeProps,
  Transaction,
  WalletTab,
  Withdrawal,
} from "../types/wallet.types";

const TYPE_ICON: Record<string, string> = {
  INCOME: "💰",
  EXPENSE: "🎮",
  TRANSFER: "↗️",
  DEPOSIT: "💳",
  WITHDRAWAL: "💸",
  GAME_ENTRY: "🎮",
  GAME_WIN: "🏆",
  AGENT_COMMISSION: "🤝",
  REFERRAL_BONUS: "🎁",
};
const TYPE_COLOR: Record<string, string> = {
  INCOME: "text-emerald-400",
  DEPOSIT: "text-emerald-400",
  GAME_WIN: "text-emerald-400",
  REFERRAL_BONUS: "text-emerald-400",
  AGENT_COMMISSION: "text-emerald-400",
  EXPENSE: "text-rose-400",
  WITHDRAWAL: "text-rose-400",
  GAME_ENTRY: "text-rose-400",
  TRANSFER: "text-orange-400",
};
const INCOME_TYPES = new Set([
  "INCOME",
  "DEPOSIT",
  "GAME_WIN",
  "REFERRAL_BONUS",
  "AGENT_COMMISSION",
]);

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  FAILED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  PROCESSING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const quickActions = [
  {
    label: "Deposit",
    icon: <FaArrowDown />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    path: "/deposit-money",
  },
  {
    label: "Withdraw",
    icon: <FaArrowUp />,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    path: "/get-money",
  },
  {
    label: "Transfer",
    icon: <FaExchangeAlt />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    path: "/transfer",
  },
  {
    label: "Request",
    icon: <FaMoneyCheckAlt />,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    path: "/request-money",
  },
];

function StatusBadge({ status }: StatusBadgeProps) {
  const isPending = status === "PENDING" || status === "PROCESSING";
  return (
    <span
      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${STATUS_STYLE[status] ?? ""}`}
    >
      {isPending && <FiClock className="text-[8px]" />}
      {status === "PROCESSING"
        ? "Processing"
        : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyWallet() {
  const navigate = useNavigate();
  const { balance, syncFromUser } = useWalletStore();
  const [tab, setTab] = useState<WalletTab>("overview");

  const { data: me } = useMe();
  const { data: txData } = useTransactions({ limit: 50 });
  const { data: deposits = [] } = useDeposits();
  const { data: withdrawals = [] } = useWithdrawals();

  useEffect(() => {
    if (me?.coinsBalance !== undefined) syncFromUser(me.coinsBalance);
  }, [me?.coinsBalance, syncFromUser]);

  const transactions = txData?.data ?? [];
  const formatted = balance.toLocaleString();

  // IDs of deposits/withdrawals that already have a completed transaction record
  const completedDepositIds = new Set(
    transactions
      .filter((t: Transaction) => t.type === "DEPOSIT")
      .map((t: Transaction) => t.id),
  );
  const completedWithdrawalIds = new Set(
    transactions
      .filter((t: Transaction) => t.type === "WITHDRAWAL")
      .map((t: Transaction) => t.id),
  );

  const activity: ActivityItem[] = [
    // All completed transactions (game, transfer, etc.)
    ...transactions
      .filter(
        (t: Transaction) => t.type !== "DEPOSIT" && t.type !== "WITHDRAWAL",
      )
      .map((t: Transaction) => ({
        id: t.id,
        kind: "tx" as const,
        title: t.title,
        subtitle: formatDate(t.date),
        date: t.date,
        amount: Number(t.amount),
        isIncome: INCOME_TYPES.has(t.type),
        status: (t.status ?? "COMPLETED") as WalletActivityStatus,
        icon: TYPE_ICON[t.type] ?? "💱",
        color: TYPE_COLOR[t.type] ?? "text-gray-400",
      })),
    // All deposits (pending + completed)
    ...deposits.map((d: Deposit) => ({
      id: d.id,
      kind: "deposit" as const,
      title: `Deposit via ${d.method}`,
      subtitle: formatDate(d.createdAt),
      date: d.createdAt,
      amount: d.amount,
      isIncome: true,
      status: d.status as WalletActivityStatus,
      icon: "💳",
      color: "text-emerald-400",
    })),
    // All withdrawals (pending + completed)
    ...withdrawals.map((w: Withdrawal) => ({
      id: w.id,
      kind: "withdrawal" as const,
      title: `Withdraw via ${w.method}`,
      subtitle: `${w.accountNumber} · ${formatDate(w.createdAt)}`,
      date: w.createdAt,
      amount: w.amount,
      isIncome: false,
      status: w.status as WalletActivityStatus,
      icon: "💸",
      color: "text-rose-400",
    })),
  ]
    // Remove duplicates: if a deposit/withdrawal is COMPLETED and already in transactions, keep only the tx version
    .filter((item) => {
      if (
        item.kind === "deposit" &&
        item.status === "COMPLETED" &&
        completedDepositIds.has(item.id)
      )
        return false;
      if (
        item.kind === "withdrawal" &&
        item.status === "COMPLETED" &&
        completedWithdrawalIds.has(item.id)
      )
        return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  const pendingCount =
    deposits.filter((d: Deposit) => d.status === "PENDING").length +
    withdrawals.filter(
      (w: Withdrawal) => w.status === "PENDING" || w.status === "PROCESSING",
    ).length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center">
              <FiGrid className="text-teal-400 text-sm" />
            </div>
            <span className="text-base font-black">My Wallet</span>
          </div>
        }
        right={
          <Avatar
            src={me?.avatar ?? "https://i.pravatar.cc/40"}
            name={me?.firstName ?? "—"}
            coins={formatted}
          />
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-28">
        {/* Balance hero */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Total Balance
          </p>
          <div className="flex items-end gap-2 mb-4">
            <FaCoins className="text-yellow-400 text-2xl mb-1" />
            <span className="text-4xl font-black text-yellow-300 leading-none">
              {formatted}
            </span>
            <span className="text-sm text-gray-500 mb-1">coins</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(({ label, icon, color, bg, path }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className={`${bg} border rounded-xl py-2.5 flex flex-col items-center gap-1 active:scale-95 transition-all`}
              >
                <span className={`text-sm ${color}`}>{icon}</span>
                <span className="text-[10px] font-bold text-gray-300">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["overview", "requests"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === t
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "bg-white/[0.05] text-gray-400 hover:bg-white/10"
              }`}
            >
              {t === "overview"
                ? "Overview"
                : `Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
            </button>
          ))}
        </div>

        {/* Overview — unified activity */}
        {tab === "overview" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Recent Activity
              </p>
              <button
                type="button"
                onClick={() => navigate("/wallet-history")}
                className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
              >
                See all
              </button>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
              {activity.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-600 text-sm">
                  No activity yet
                </div>
              ) : (
                activity.map((item, i) => (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < activity.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                  >
                    <div className="w-9 h-9 bg-white/[0.06] rounded-xl flex items-center justify-center text-base shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-white truncate">
                          {item.title}
                        </p>
                        {item.status !== "COMPLETED" && (
                          <StatusBadge status={item.status} />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {item.subtitle}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-black shrink-0 ${item.color}`}
                    >
                      {item.isIncome ? "+" : "-"}
                      {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Requests tab */}
        {tab === "requests" && (
          <div className="flex flex-col gap-5">
            {/* Deposits */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Deposit Requests
              </p>
              {deposits.length === 0 ? (
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-6 text-center text-gray-600 text-sm">
                  No deposit requests yet
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {deposits.map((d: Deposit) => (
                    <div
                      key={d.id}
                      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3.5 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <FaArrowDown className="text-emerald-400 text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">
                          Deposit via {d.method}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {formatDate(d.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="flex items-center gap-1 text-sm font-black text-yellow-300">
                          <FaCoins className="text-xs text-yellow-400" />
                          {d.amount.toLocaleString()}
                        </span>
                        <StatusBadge status={d.status as WalletActivityStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Withdrawals */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Withdrawal Requests
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/withdrawal-status")}
                  className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
                >
                  Full history →
                </button>
              </div>
              {withdrawals.length === 0 ? (
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-6 text-center text-gray-600 text-sm">
                  No withdrawal requests yet
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {withdrawals.map((w: Withdrawal) => (
                    <div
                      key={w.id}
                      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3.5 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <FaArrowUp className="text-rose-400 text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">
                          Withdraw via {w.method}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {w.accountNumber} · {formatDate(w.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="flex items-center gap-1 text-sm font-black text-rose-300">
                          <FaCoins className="text-xs text-yellow-400" />
                          {w.amount.toLocaleString()}
                        </span>
                        <StatusBadge status={w.status as WalletActivityStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
