import { useEffect } from "react";
import { FaCoins, FaGamepad, FaMedal, FaTrophy } from "react-icons/fa";
import {
  FiArrowRight,
  FiClock,
  FiEdit2,
  FiLogOut,
  FiMail,
  FiPhone,
  FiSettings,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useWalletStore } from "../store/wallet.store";
import { AppBar, BottomNav } from "../components/ui/Layout";
import { useMe, useMyStats } from "../hooks/useUser";

const badges = [
  { emoji: "🏆", label: "First Win" },
  { emoji: "🎯", label: "Sharp Eye" },
  { emoji: "🔥", label: "Hot Streak" },
  { emoji: "⚡", label: "Speed King" },
  { emoji: "💎", label: "Diamond" },
  { emoji: "🎱", label: "Bingo Pro" },
];

const quickActions = [
  { label: "Invite Users", icon: <FiUserPlus />, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", path: "/invite" },
  { label: "Agent Panel",  icon: <FiSettings />, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", path: "/agent-deposit" },
];

const moreItems = [
  { icon: <FiClock />,   label: "Game History", sub: "View past games",        path: "/history",  danger: false },
  { icon: <FiSettings />, label: "Settings",    sub: "App preferences",        path: "/settings", danger: false },
  { icon: <FiLogOut />,  label: "Sign Out",     sub: "Log out of your account", path: null,        danger: true  },
];

export default function Profile() {
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  const { syncFromUser } = useWalletStore();

  const { data: me } = useMe();
  const { data: stats } = useMyStats();

  useEffect(() => {
    if (me?.coinsBalance !== undefined) syncFromUser(me.coinsBalance);
  }, [me?.coinsBalance, syncFromUser]);

  const handleSignOut = () => { clear(); navigate("/signin", { replace: true }); };

  const statItems = [
    { icon: <FaGamepad />, label: "Games",    value: String(stats?.totalGames ?? "—"), color: "text-rose-400"    },
    { icon: <FaTrophy />,  label: "Wins",     value: String(stats?.wins ?? "—"),       color: "text-yellow-400"  },
    { icon: <FaMedal />,   label: "Win Rate", value: stats ? `${stats.winRate}%` : "—", color: "text-emerald-400" },
    { icon: <FaCoins />,   label: "Earned",   value: stats ? `${(stats.totalEarned / 1000).toFixed(1)}k` : "—", color: "text-cyan-400" },
  ];

  const fields = [
    { icon: <FiUser />,  label: "Full Name", value: me ? `${me.firstName} ${me.lastName}` : "—" },
    { icon: <FiMail />,  label: "Email",     value: me?.email ?? "—" },
    { icon: <FiPhone />, label: "Phone",     value: me?.phone ?? "Not set" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <FiUser className="text-emerald-400 text-sm" />
            </div>
            <span className="text-base font-black">Profile</span>
          </div>
        }
        right={
          <button
            type="button"
            aria-label="Edit profile"
            onClick={() => navigate("/edit-profile")}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <FiEdit2 className="text-white text-sm" aria-hidden="true" />
          </button>
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-28">
        {/* Avatar hero */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={me?.avatar ?? "https://i.pravatar.cc/80"}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500/40"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-[10px]">✓</span>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-white">
              {me ? `${me.firstName} ${me.lastName}` : "—"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              @{me?.username ?? "—"} · Member since {me ? new Date(me.createdAt).getFullYear() : "—"}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-1.5">
            <FaCoins className="text-yellow-400 text-xs" />
            <span className="text-yellow-300 text-sm font-black">
              {(me?.coinsBalance ?? 0).toLocaleString()} coins
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {statItems.map(({ icon, label, value, color }) => (
            <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3 flex flex-col items-center gap-1">
              <span className={`text-base ${color}`}>{icon}</span>
              <span className="text-base font-black text-white leading-none">{value}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Badges</p>
          <div className="grid grid-cols-3 gap-2">
            {badges.map(({ emoji, label }) => (
              <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3 flex flex-col items-center gap-1.5">
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-gray-400 font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ label, icon, color, bg, path }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => navigate(path)}
                className={`${bg} border rounded-2xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-all hover:brightness-110`}
              >
                <span className={`text-xl ${color}`} aria-hidden="true">{icon}</span>
                <span className="text-sm font-bold text-white">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* More */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">More</p>
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
            {moreItems.map(({ icon, label, sub, path, danger }, i) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => danger ? handleSignOut() : path && navigate(path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.04] transition-colors text-left ${i < moreItems.length - 1 ? "border-b border-white/[0.05]" : ""}`}
              >
                <span className={`text-sm shrink-0 ${danger ? "text-rose-400" : "text-gray-400"}`}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${danger ? "text-rose-400" : "text-white"}`}>{label}</p>
                  <p className="text-[11px] text-gray-500">{sub}</p>
                </div>
                <FiArrowRight className="text-gray-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Account Info</p>
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
            {fields.map(({ icon, label, value }, i) => (
              <div key={label} className={`flex items-center gap-4 px-4 py-3.5 ${i < fields.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
                <span className="text-gray-500 text-sm shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-white truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
