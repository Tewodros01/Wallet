import { useState } from "react";
import { FaCoins, FaTrophy } from "react-icons/fa";
import {
  FiBell,
  FiArrowLeft,
  FiCheck,
  FiGift,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";

type NType = "win" | "deposit" | "invite" | "tournament" | "system" | "mission";

interface Notification {
  id: number;
  type: NType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL: Notification[] = [
  { id: 1,  type: "win",        title: "You won! 🎉",              body: "You won 500 coins in Friday Fever room.",          time: "2 min ago",    read: false },
  { id: 2,  type: "deposit",    title: "Deposit approved",          body: "Your deposit of 1,000 coins was approved by Sara K.", time: "15 min ago",  read: false },
  { id: 3,  type: "tournament", title: "Tournament starting soon",  body: "Weekend Warriors tournament starts in 30 minutes.", time: "28 min ago",  read: false },
  { id: 4,  type: "invite",     title: "Friend joined!",            body: "Mike T. joined using your referral code. +50 coins earned.", time: "1 hr ago", read: false },
  { id: 5,  type: "mission",    title: "Mission complete",          body: "Daily login streak: 4 days. Claim your reward!",   time: "2 hr ago",    read: true  },
  { id: 6,  type: "win",        title: "Bingo! You won again",      body: "You won 300 coins in Beginner Room.",              time: "Yesterday",   read: true  },
  { id: 7,  type: "system",     title: "New feature available",     body: "Keno game is now live. Pick your numbers and win!", time: "Yesterday",  read: true  },
  { id: 8,  type: "deposit",    title: "Withdrawal pending",        body: "Your withdrawal request of 800 coins is awaiting agent approval.", time: "2 days ago", read: true },
  { id: 9,  type: "tournament", title: "Tournament result",         body: "You finished #12 in the Daily Grind tournament.",  time: "2 days ago",  read: true  },
  { id: 10, type: "invite",     title: "Referral bonus",            body: "James O. completed 5 games. You earned +100 coins.", time: "3 days ago", read: true },
];

const TYPE_META: Record<NType, { icon: React.ReactNode; bg: string; color: string }> = {
  win:        { icon: <FaTrophy />,  bg: "bg-yellow-400/15 border-yellow-400/25",  color: "text-yellow-400"  },
  deposit:    { icon: <FaCoins />,   bg: "bg-emerald-500/15 border-emerald-500/25", color: "text-emerald-400" },
  invite:     { icon: <FiUsers />,   bg: "bg-violet-500/15 border-violet-500/25",  color: "text-violet-400"  },
  tournament: { icon: <FiZap />,     bg: "bg-orange-500/15 border-orange-500/25",  color: "text-orange-400"  },
  system:     { icon: <FiBell />,    bg: "bg-blue-500/15 border-blue-500/25",      color: "text-blue-400"    },
  mission:    { icon: <FiGift />,    bg: "bg-rose-500/15 border-rose-500/25",      color: "text-rose-400"    },
};

const TABS = ["All", "Unread"] as const;
type Tab = typeof TABS[number];

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems]   = useState<Notification[]>(INITIAL);
  const [tab, setTab]       = useState<Tab>("All");

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead    = (id: number) => setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const visible = tab === "Unread" ? items.filter((n) => !n.read) : items;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Go back" onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-base font-black">Notifications</span>
              {unreadCount > 0 && (
                <span className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        }
        right={
          unreadCount > 0 ? (
            <button type="button" onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              <FiCheck className="text-xs" /> Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4 px-5 py-4 pb-10">
        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === t
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "bg-white/[0.05] text-gray-400 hover:bg-white/10"
              }`}>
              {t}{t === "Unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-600">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <FiBell className="text-2xl" />
            </div>
            <p className="text-sm font-semibold">No notifications</p>
            <p className="text-xs text-gray-700">You're all caught up!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((n) => {
              const meta = TYPE_META[n.type];
              return (
                <button key={n.id} type="button" onClick={() => markRead(n.id)}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    n.read
                      ? "bg-white/[0.03] border-white/[0.06]"
                      : "bg-white/[0.06] border-white/[0.10]"
                  }`}>
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.bg}`}>
                    <span className={`text-sm ${meta.color}`}>{meta.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-sm font-bold truncate ${n.read ? "text-gray-300" : "text-white"}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-gray-600 mt-1.5">{n.time}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
