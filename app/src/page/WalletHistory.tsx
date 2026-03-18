import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import { FiArrowDown, FiArrowLeft, FiArrowUp, FiSearch, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";

type TxType = "deposit" | "withdraw" | "transfer" | "win" | "entry" | "bonus";

interface Tx {
  id: number;
  type: TxType;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

const TRANSACTIONS: Tx[] = [
  { id: 1,  type: "win",      title: "Bingo Win",          subtitle: "Friday Fever · RTK-A1B2",    amount: +500,   date: "Today, 2:30 PM",      status: "completed" },
  { id: 2,  type: "entry",    title: "Room Entry Fee",      subtitle: "Friday Fever · RTK-A1B2",    amount: -100,   date: "Today, 2:28 PM",      status: "completed" },
  { id: 3,  type: "bonus",    title: "Daily Bonus",         subtitle: "Spin wheel reward",           amount: +200,   date: "Today, 9:00 AM",      status: "completed" },
  { id: 4,  type: "deposit",  title: "Deposit",             subtitle: "Via Sara K. (Agent)",         amount: +1000,  date: "Yesterday, 3:00 PM",  status: "completed" },
  { id: 5,  type: "entry",    title: "Room Entry Fee",      subtitle: "Midnight Rush · RTK-C3D4",   amount: -500,   date: "Yesterday, 1:15 PM",  status: "completed" },
  { id: 6,  type: "win",      title: "Bingo Win",           subtitle: "Beginner Room · RTK-E5F6",   amount: +300,   date: "Yesterday, 9:00 AM",  status: "completed" },
  { id: 7,  type: "transfer", title: "Transfer Out",        subtitle: "To Tigist A.",                amount: -200,   date: "Dec 13, 11:00 AM",    status: "completed" },
  { id: 8,  type: "withdraw", title: "Withdrawal",          subtitle: "Via Telebirr · Mike T.",      amount: -800,   date: "Dec 12, 4:00 PM",     status: "pending"   },
  { id: 9,  type: "deposit",  title: "Deposit",             subtitle: "Via Mike T. (Agent)",         amount: +500,   date: "Dec 11, 2:00 PM",     status: "completed" },
  { id: 10, type: "win",      title: "Keno Win",            subtitle: "Picked 6/20 numbers",         amount: +750,   date: "Dec 11, 10:30 AM",    status: "completed" },
  { id: 11, type: "transfer", title: "Transfer In",         subtitle: "From Dawit H.",               amount: +150,   date: "Dec 10, 6:00 PM",     status: "completed" },
  { id: 12, type: "entry",    title: "Room Entry Fee",      subtitle: "High Stakes · RTK-G7H8",     amount: -1000,  date: "Dec 10, 3:00 PM",     status: "failed"    },
  { id: 13, type: "bonus",    title: "Referral Bonus",      subtitle: "James O. joined & played",    amount: +100,   date: "Dec 9, 12:00 PM",     status: "completed" },
  { id: 14, type: "deposit",  title: "Deposit",             subtitle: "Via Sara K. (Agent)",         amount: +2000,  date: "Dec 8, 9:00 AM",      status: "completed" },
];

const TYPE_META: Record<TxType, { icon: React.ReactNode; color: string; bg: string }> = {
  win:      { icon: "🏆", color: "text-yellow-400",  bg: "bg-yellow-400/10"  },
  entry:    { icon: "🎮", color: "text-rose-400",    bg: "bg-rose-400/10"    },
  deposit:  { icon: "💳", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  withdraw: { icon: "💸", color: "text-orange-400",  bg: "bg-orange-400/10"  },
  transfer: { icon: "↗️", color: "text-cyan-400",    bg: "bg-cyan-400/10"    },
  bonus:    { icon: "🎁", color: "text-violet-400",  bg: "bg-violet-400/10"  },
};

const STATUS_STYLE = {
  completed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pending:   "text-orange-400 bg-orange-500/10 border-orange-500/20",
  failed:    "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const TABS = ["All", "Income", "Expense"] as const;
type Tab = typeof TABS[number];

export default function WalletHistory() {
  const navigate = useNavigate();
  const [tab,    setTab]    = useState<Tab>("All");
  const [search, setSearch] = useState("");

  const totalIn  = TRANSACTIONS.filter((t) => t.amount > 0 && t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const totalOut = TRANSACTIONS.filter((t) => t.amount < 0 && t.status === "completed").reduce((s, t) => s + Math.abs(t.amount), 0);

  const filtered = TRANSACTIONS.filter((t) => {
    const matchTab =
      tab === "All" ? true :
      tab === "Income" ? t.amount > 0 :
      t.amount < 0;
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Go back" onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
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
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Total In</p>
              <div className="flex items-center gap-1 mt-0.5">
                <FaCoins className="text-yellow-400 text-xs" />
                <span className="text-base font-black text-emerald-400">{totalIn.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
              <FiArrowUp className="text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Total Out</p>
              <div className="flex items-center gap-1 mt-0.5">
                <FaCoins className="text-yellow-400 text-xs" />
                <span className="text-base font-black text-rose-400">{totalOut.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
          <input type="text" placeholder="Search transactions…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === t
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "bg-white/[0.05] text-gray-400 hover:bg-white/10"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-600">
            <FaCoins className="text-3xl" />
            <p className="text-sm font-semibold">No transactions found</p>
          </div>
        ) : (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
            {filtered.map((tx, i) => {
              const meta = TYPE_META[tx.type];
              return (
                <div key={tx.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i < filtered.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                  <div className={`w-10 h-10 ${meta.bg} rounded-xl flex items-center justify-center text-base shrink-0`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-white truncate">{tx.title}</p>
                      {tx.status !== "completed" && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border shrink-0 ${STATUS_STYLE[tx.status]}`}>
                          {tx.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{tx.subtitle}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{tx.date}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <FaCoins className="text-yellow-400 text-[10px]" />
                    <span className={`text-sm font-black ${tx.amount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
