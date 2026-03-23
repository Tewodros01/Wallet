import { useEffect, useMemo, useState } from "react";
import { FaArrowDown, FaArrowUp, FaCoins } from "react-icons/fa";
import { FiClock, FiGrid } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { useDeposits, useWithdrawals } from "../payments";
import { useTransactions } from "./hooks";
import { useMe } from "./hooks";
import { useWalletStore } from "../../../store/wallet.store";
import type {
  ActivityItem,
  Deposit,
  StatusBadgeProps,
  WalletActivityStatus,
  WalletTab,
  Withdrawal,
} from "../../../types/wallet.types";
import { AppBar, Avatar, BottomNav } from "../../components/ui/Layout";
import {
  WALLET_QUICK_ACTIONS,
  WALLET_STATUS_STYLE,
  WALLET_TABS,
} from "./constants";
import {
  buildWalletActivity,
  formatWalletDate,
  getPendingWalletRequestCount,
  getWalletStatusLabel,
} from "./utils";

function StatusBadge({ status }: StatusBadgeProps) {
  const isPending = status === "PENDING" || status === "PROCESSING";
  return (
    <span
      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${WALLET_STATUS_STYLE[status] ?? ""}`}
    >
      {isPending && <FiClock className="text-[8px]" />}
      {getWalletStatusLabel(status)}
    </span>
  );
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

  const formattedBalance = useMemo(() => balance.toLocaleString(), [balance]);

  const activity = useMemo<ActivityItem[]>(
    () => buildWalletActivity(txData?.data ?? [], deposits, withdrawals),
    [txData?.data, deposits, withdrawals],
  );
  const pendingCount = useMemo(
    () => getPendingWalletRequestCount(deposits, withdrawals),
    [deposits, withdrawals],
  );

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
            src={me?.avatar}
            name={me?.firstName ?? "—"}
            coins={formattedBalance}
          />
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-28">
        {/* Balance hero */}
        <div className="bg-linear-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Total Balance
          </p>
          <div className="flex items-end gap-2 mb-4">
            <FaCoins className="text-yellow-400 text-2xl mb-1" />
            <span className="text-4xl font-black text-yellow-300 leading-none">
              {formattedBalance}
            </span>
            <span className="text-sm text-gray-500 mb-1">coins</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {WALLET_QUICK_ACTIONS.map(
              ({ label, icon: Icon, color, bg, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(path)}
                  className={`${bg} border rounded-xl py-2.5 flex flex-col items-center gap-1 active:scale-95 transition-all`}
                >
                  <span className={`text-sm ${color}`}>
                    <Icon />
                  </span>
                  <span className="text-[10px] font-bold text-gray-300">
                    {label}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {WALLET_TABS.map((t) => (
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
                onClick={() => navigate(APP_ROUTES.walletHistory)}
                className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
              >
                See all
              </button>
            </div>
            <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
              {activity.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-600 text-sm">
                  No activity yet
                </div>
              ) : (
                activity.map((item, i) => (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < activity.length - 1 ? "border-b border-white/5" : ""}`}
                  >
                    <div className="w-9 h-9 bg-white/6 rounded-xl flex items-center justify-center text-base shrink-0">
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
                <div className="bg-white/4 border border-white/7 rounded-2xl px-4 py-6 text-center text-gray-600 text-sm">
                  No deposit requests yet
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {deposits.map((d: Deposit) => (
                    <div
                      key={d.id}
                      className="bg-white/4 border border-white/7 rounded-2xl px-4 py-3.5 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <FaArrowDown className="text-emerald-400 text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">
                          Deposit via {d.method}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {formatWalletDate(d.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="flex items-center gap-1 text-sm font-black text-yellow-300">
                          <FaCoins className="text-xs text-yellow-400" />
                          {d.amount.toLocaleString()}
                        </span>
                        <StatusBadge
                          status={d.status as WalletActivityStatus}
                        />
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
                  onClick={() => navigate(APP_ROUTES.withdrawalStatus)}
                  className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
                >
                  Full history →
                </button>
              </div>
              {withdrawals.length === 0 ? (
                <div className="bg-white/4 border border-white/7 rounded-2xl px-4 py-6 text-center text-gray-600 text-sm">
                  No withdrawal requests yet
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {withdrawals.map((w: Withdrawal) => (
                    <div
                      key={w.id}
                      className="bg-white/4 border border-white/7 rounded-2xl px-4 py-3.5 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <FaArrowUp className="text-rose-400 text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">
                          Withdraw via {w.method}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {w.accountNumber} · {formatWalletDate(w.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="flex items-center gap-1 text-sm font-black text-rose-300">
                          <FaCoins className="text-xs text-yellow-400" />
                          {w.amount.toLocaleString()}
                        </span>
                        <StatusBadge
                          status={w.status as WalletActivityStatus}
                        />
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
