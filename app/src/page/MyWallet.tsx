import { useEffect } from "react";
import { FaArrowDown, FaArrowUp, FaCoins, FaExchangeAlt, FaWallet } from "react-icons/fa";
import { FiGrid, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar, Avatar, BottomNav } from "../components/ui/Layout";
import { useWalletStore } from "../store/wallet.store";
import { useWallets } from "../hooks/useWallets";
import { useTransactions } from "../hooks/useTransactions";
import { useMe } from "../hooks/useUser";

const TYPE_ICON: Record<string, string> = {
  INCOME: "💰", EXPENSE: "🎮", TRANSFER: "↗️",
  DEPOSIT: "💳", WITHDRAWAL: "💸", GAME_ENTRY: "🎮",
  GAME_WIN: "🏆", AGENT_COMMISSION: "🤝", REFERRAL_BONUS: "🎁",
};
const TYPE_COLOR: Record<string, string> = {
  INCOME: "text-emerald-400", DEPOSIT: "text-emerald-400", GAME_WIN: "text-emerald-400", REFERRAL_BONUS: "text-emerald-400", AGENT_COMMISSION: "text-emerald-400",
  EXPENSE: "text-rose-400", WITHDRAWAL: "text-rose-400", GAME_ENTRY: "text-rose-400",
  TRANSFER: "text-orange-400",
};
const INCOME_TYPES = new Set(["INCOME", "DEPOSIT", "GAME_WIN", "REFERRAL_BONUS", "AGENT_COMMISSION"]);

const quickActions = [
  { label: "Deposit",  icon: <FaArrowDown />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", path: "/deposit-money" },
  { label: "Withdraw", icon: <FaArrowUp />,   color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20",       path: "/get-money"     },
  { label: "Transfer", icon: <FaExchangeAlt />, color: "text-cyan-400",  bg: "bg-cyan-500/10 border-cyan-500/20",       path: "/transfer"      },
];

export default function MyWallet() {
  const navigate = useNavigate();
  const { balance, syncFromUser } = useWalletStore();

  const { data: me } = useMe();
  const { data: wallets = [] } = useWallets();
  const { data: txData } = useTransactions({ limit: 10 });

  useEffect(() => {
    if (me?.coinsBalance !== undefined) syncFromUser(me.coinsBalance);
  }, [me?.coinsBalance, syncFromUser]);

  const transactions = txData?.data ?? [];
  const formatted = balance.toLocaleString();

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
          <Avatar src={me?.avatar ?? "https://i.pravatar.cc/40"} name={me?.firstName ?? "—"} coins={formatted} />
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-28">
        {/* Total balance hero */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Total Balance</p>
          <div className="flex items-end gap-2 mb-4">
            <FaCoins className="text-yellow-400 text-2xl mb-1" />
            <span className="text-4xl font-black text-yellow-300 leading-none">{formatted}</span>
            <span className="text-sm text-gray-500 mb-1">coins</span>
          </div>
          <div className="flex gap-2">
            {quickActions.map(({ label, icon, color, bg, path }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className={`flex-1 ${bg} border rounded-xl py-2.5 flex flex-col items-center gap-1 active:scale-95 transition-all`}
              >
                <span className={`text-sm ${color}`}>{icon}</span>
                <span className="text-[10px] font-bold text-gray-300">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wallets */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">My Wallets</p>
            <button type="button" className="flex items-center gap-1 text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              <FiPlus className="text-xs" /> Add
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {wallets.length === 0 ? (
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-6 text-center text-gray-600 text-sm">
                No wallets yet
              </div>
            ) : (
              wallets.map((w: any) => (
                <div key={w.id} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-500/15 border border-teal-500/25 rounded-xl flex items-center justify-center">
                      <FaWallet className="text-teal-400 text-sm" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{w.name}</span>
                        {w.isDefault && (
                          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{w.currency}</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-white">
                    {Number(w.balance).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Recent Transactions</p>
            <button type="button" onClick={() => navigate("/wallet-history")} className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              See all
            </button>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
            {transactions.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-600 text-sm">No transactions yet</div>
            ) : (
              transactions.map((tx: any, i: number) => (
                <div key={tx.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < transactions.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                  <div className="w-9 h-9 bg-white/[0.06] rounded-xl flex items-center justify-center text-base shrink-0">
                    {TYPE_ICON[tx.type] ?? "💱"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{tx.title}</p>
                    <p className="text-[11px] text-gray-500">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`text-sm font-black shrink-0 ${TYPE_COLOR[tx.type] ?? "text-gray-400"}`}>
                    {INCOME_TYPES.has(tx.type) ? "+" : "-"}{Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
