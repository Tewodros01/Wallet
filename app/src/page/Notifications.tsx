import { FaCoins, FaTrophy } from "react-icons/fa";
import { FiBell, FiArrowLeft, FiCheck, FiGift, FiTrash2, FiUsers, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppBar } from "../components/ui/Layout";
import EmptyState from "../components/ui/EmptyState";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
} from "../hooks/useNotifications";
import { haptic } from "../lib/haptic";
import type { Notification } from "../api/notifications.api";
type NType = Notification["type"];

const TYPE_META: Record<NType, { icon: React.ReactNode; bg: string; color: string }> = {
  WIN:        { icon: <FaTrophy />,  bg: "bg-yellow-400/15 border-yellow-400/25",   color: "text-yellow-400"  },
  DEPOSIT:    { icon: <FaCoins />,   bg: "bg-emerald-500/15 border-emerald-500/25", color: "text-emerald-400" },
  WITHDRAWAL: { icon: <FaCoins />,   bg: "bg-rose-500/15 border-rose-500/25",       color: "text-rose-400"    },
  TRANSFER:   { icon: <FaCoins />,   bg: "bg-blue-500/15 border-blue-500/25",       color: "text-blue-400"    },
  INVITE:     { icon: <FiUsers />,   bg: "bg-violet-500/15 border-violet-500/25",   color: "text-violet-400"  },
  TOURNAMENT: { icon: <FiZap />,     bg: "bg-orange-500/15 border-orange-500/25",   color: "text-orange-400"  },
  SYSTEM:     { icon: <FiBell />,    bg: "bg-blue-500/15 border-blue-500/25",       color: "text-blue-400"    },
  MISSION:    { icon: <FiGift />,    bg: "bg-rose-500/15 border-rose-500/25",       color: "text-rose-400"    },
};

function timeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return "";
  }
}

const TABS = ["All", "Unread"] as const;
type Tab = typeof TABS[number];

export default function Notifications() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("All");

  const { data: items = [], isLoading } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead();
  const { mutate: deleteOne } = useDeleteNotification();

  const unreadCount = items.filter((n) => !n.read).length;
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
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </div>
        }
        right={
          unreadCount > 0 ? (
            <button type="button" onClick={() => markAllRead()} disabled={markingAll}
              className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:text-emerald-300 transition-colors disabled:opacity-50">
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

        {/* Loading */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-white/[0.04] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState type="notifications" title="No notifications" subtitle="You're all caught up!" />
        ) : (
          <AnimatePresence initial={false}>
            <div className="flex flex-col gap-2">
              {visible.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                      n.read ? "bg-white/[0.03] border-white/[0.06]" : "bg-white/[0.06] border-white/[0.10]"
                    }`}
                  >
                    <button type="button" onClick={() => { if (!n.read) { markRead(n.id); haptic.light(); } }} className="shrink-0">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${meta.bg}`}>
                        <span className={`text-sm ${meta.color}`}>{meta.icon}</span>
                      </div>
                    </button>
                    <button type="button" onClick={() => { if (!n.read) { markRead(n.id); haptic.light(); } }} className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-sm font-bold truncate ${n.read ? "text-gray-300" : "text-white"}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0 animate-pulse" />}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-gray-600 mt-1.5">{timeAgo(n.createdAt)}</p>
                    </button>
                    <button type="button" onClick={() => { deleteOne(n.id); haptic.light(); }}
                      className="shrink-0 w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-rose-500/20 transition-colors">
                      <FiTrash2 className="text-gray-600 hover:text-rose-400 text-xs" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
