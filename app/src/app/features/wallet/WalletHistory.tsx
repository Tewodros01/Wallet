import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import {
  FiArrowDown,
  FiArrowLeft,
  FiArrowUp,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDeposits, useWithdrawals } from "../payments";
import { useTransactions } from "./hooks";
import { TransactionStatus, TransactionType } from "../../../types/enums";
import type { Deposit, Withdrawal } from "../../../types/payment.types";
import type { Transaction } from "../../../types/transaction.types";
import { AppBar } from "../../components/ui/Layout";

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

const TYPE_BG: Record<string, string> = {
  INCOME: "bg-emerald-400/10",
  DEPOSIT: "bg-emerald-400/10",
  GAME_WIN: "bg-yellow-400/10",
  REFERRAL_BONUS: "bg-violet-400/10",
  AGENT_COMMISSION: "bg-teal-400/10",
  EXPENSE: "bg-rose-400/10",
  WITHDRAWAL: "bg-orange-400/10",
  GAME_ENTRY: "bg-rose-400/10",
  TRANSFER: "bg-cyan-400/10",
};

const INCOME_TYPES = new Set<TransactionType>([
  TransactionType.INCOME,
  TransactionType.DEPOSIT,
  TransactionType.GAME_WIN,
  TransactionType.REFERRAL_BONUS,
  TransactionType.AGENT_COMMISSION,
]);

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  PENDING: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  FAILED: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  REVERSED: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

const TABS = ["All", "Income", "Expense"] as const;
type Tab = (typeof TABS)[number];

type HistoryItem = Pick<
  Transaction,
  "id" | "type" | "title" | "amount" | "date" | "status"
> & {
  note: string | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0)
    return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (days === 1)
    return `Yesterday, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WalletHistory() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");

  const { data: txData, isLoading } = useTransactions({ limit: 100 });
  const { data: deposits = [] } = useDeposits();
  const { data: withdrawals = [] } = useWithdrawals();

  const transactions = txData?.data ?? [];

  // Approved deposit/withdrawal IDs already present as Transaction records
  const txDepositIds = new Set(
    transactions
      .filter((t: Transaction) => t.type === TransactionType.DEPOSIT)
      .map((t: Transaction) => t.id),
  );
  const txWithdrawalIds = new Set(
    transactions
      .filter((t: Transaction) => t.type === TransactionType.WITHDRAWAL)
      .map((t: Transaction) => t.id),
  );

  // Only COMPLETED deposits/withdrawals not already in transactions
  const extraDeposits: HistoryItem[] = deposits
    .filter((d: Deposit) => d.status === "COMPLETED" && !txDepositIds.has(d.id))
    .map((d: Deposit) => ({
      id: d.id,
      type: TransactionType.DEPOSIT,
      title: `Deposit via ${d.method}`,
      amount: String(d.amount),
      date: d.createdAt,
      status: TransactionStatus.COMPLETED,
      note: null,
    }));

  const extraWithdrawals: HistoryItem[] = withdrawals
    .filter(
      (w: Withdrawal) => w.status === "COMPLETED" && !txWithdrawalIds.has(w.id),
    )
    .map((w: Withdrawal) => ({
      id: w.id,
      type: TransactionType.WITHDRAWAL,
      title: `Withdraw via ${w.method}`,
      amount: String(w.amount),
      date: w.createdAt,
      status: TransactionStatus.COMPLETED,
      note: w.accountNumber,
    }));

  const allItems: HistoryItem[] = [
    ...transactions,
    ...extraDeposits,
    ...extraWithdrawals,
  ].sort(
    (a: HistoryItem, b: HistoryItem) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const filtered = allItems.filter((tx: HistoryItem) => {
    const isIncome = INCOME_TYPES.has(tx.type);
    const matchTab =
      tab === "All" ? true : tab === "Income" ? isIncome : !isIncome;
    const matchSearch =
      tx.title.toLowerCase().includes(search.toLowerCase()) ||
      (tx.note ?? "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalIn = allItems
    .filter(
      (t: HistoryItem) => INCOME_TYPES.has(t.type) && t.status === "COMPLETED",
    )
    .reduce((s: number, t: HistoryItem) => s + Number(t.amount), 0);
  const totalOut = allItems
    .filter(
      (t: HistoryItem) => !INCOME_TYPES.has(t.type) && t.status === "COMPLETED",
    )
    .reduce((s: number, t: HistoryItem) => s + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <span className="text-base font-black">Transaction History</span>
          </div>
        }
      />

      <div className="flex flex-col gap-4 px-5 py-4 pb-10">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
              <FiArrowDown className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                Total In
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <FaCoins className="text-yellow-400 text-xs" />
                <span className="text-base font-black text-emerald-400">
                  {totalIn.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
              <FiArrowUp className="text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                Total Out
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <FaCoins className="text-yellow-400 text-xs" />
                <span className="text-base font-black text-rose-400">
                  {totalOut.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
          <input
            type="text"
            aria-label="Search transactions"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/4 border border-white/7 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === t
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-white/4 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-600">
            <FaCoins className="text-3xl" />
            <p className="text-sm font-semibold">No transactions found</p>
          </div>
        ) : (
          <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
            {filtered.map((tx: HistoryItem, i: number) => (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/2 transition-colors ${i < filtered.length - 1 ? "border-b border-white/5" : ""}`}
                onClick={() => navigate(`/transaction/${tx.id}`)}
              >
                <div
                  className={`w-10 h-10 ${TYPE_BG[tx.type] ?? "bg-white/6"} rounded-xl flex items-center justify-center text-base shrink-0`}
                >
                  <span className={TYPE_COLOR[tx.type] ?? "text-white"}>
                    {TYPE_ICON[tx.type] ?? "💱"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white truncate">
                      {tx.title}
                    </p>
                    {tx.status !== TransactionStatus.COMPLETED && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border shrink-0 ${STATUS_STYLE[tx.status] ?? ""}`}
                      >
                        {tx.status}
                      </span>
                    )}
                  </div>
                  {tx.note && (
                    <p className="text-[11px] text-gray-500 truncate">
                      {tx.note}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {formatDate(tx.date)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <FaCoins className="text-yellow-400 text-[10px]" />
                  <span
                    className={`text-sm font-black ${INCOME_TYPES.has(tx.type) ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {INCOME_TYPES.has(tx.type) ? "+" : "-"}
                    {Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
