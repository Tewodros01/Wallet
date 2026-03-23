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
import { APP_ROUTES } from "../../../config/routes";
import { getAvatarInitials, getPublicAssetUrl } from "../../../lib/assets";
import { useLogout, useMe, useMyStats } from "./hooks";
import { useAuthStore } from "../../../store/auth.store";
import { useWalletStore } from "../../../store/wallet.store";
import { AppBar, BottomNav } from "../../components/ui/Layout";
import { badges } from "./profileBadges";

const quickActions = [
  {
    label: "Invite Users",
    icon: <FiUserPlus />,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    path: APP_ROUTES.invite,
  },
];

const moreItems = [
  {
    icon: <FiClock />,
    label: "Game History",
    sub: "View past games",
    path: APP_ROUTES.history,
    danger: false,
  },
  {
    icon: <FiSettings />,
    label: "Settings",
    sub: "App preferences",
    path: APP_ROUTES.settings,
    danger: false,
  },
  {
    icon: <FiLogOut />,
    label: "Sign Out",
    sub: "Log out of your account",
    path: null,
    danger: true,
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAgent = user?.role === "AGENT";
  const { syncFromUser } = useWalletStore();

  const { data: me } = useMe();
  const { data: stats } = useMyStats();
  const { mutate: logout, isPending: isSigningOut } = useLogout();

  useEffect(() => {
    if (me?.coinsBalance !== undefined) syncFromUser(me.coinsBalance);
  }, [me?.coinsBalance, syncFromUser]);

  const handleSignOut = () => {
    logout(undefined, {
      onSettled: () => {
        navigate(APP_ROUTES.signin, { replace: true });
      },
    });
  };

  const statItems = [
    {
      icon: <FaGamepad />,
      label: "Games",
      value: String(stats?.totalGames ?? "—"),
      color: "text-rose-400",
      glow: "shadow-[0_16px_40px_rgba(244,63,94,0.14)]",
      surface: "from-rose-500/16 via-rose-500/6 to-transparent",
    },
    {
      icon: <FaTrophy />,
      label: "Wins",
      value: String(stats?.wins ?? "—"),
      color: "text-yellow-400",
      glow: "shadow-[0_16px_40px_rgba(251,191,36,0.14)]",
      surface: "from-amber-500/16 via-amber-500/6 to-transparent",
    },
    {
      icon: <FaMedal />,
      label: "Win Rate",
      value: stats ? `${stats.winRate}%` : "—",
      color: "text-emerald-400",
      glow: "shadow-[0_16px_40px_rgba(16,185,129,0.14)]",
      surface: "from-emerald-500/16 via-emerald-500/6 to-transparent",
    },
    {
      icon: <FaCoins />,
      label: "Earned",
      value: stats ? `${(stats.totalEarned / 1000).toFixed(1)}k` : "—",
      color: "text-cyan-400",
      glow: "shadow-[0_16px_40px_rgba(34,211,238,0.14)]",
      surface: "from-cyan-500/16 via-cyan-500/6 to-transparent",
    },
  ];

  const badgeUnlocked = stats
    ? Math.min(badges.length, Math.max(1, stats.wins))
    : 3;

  const fields = [
    {
      icon: <FiUser />,
      label: "Full Name",
      value: me ? `${me.firstName} ${me.lastName}` : "—",
    },
    { icon: <FiMail />, label: "Email", value: me?.email ?? "—" },
    { icon: <FiPhone />, label: "Phone", value: me?.phone ?? "Not set" },
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
            title="Edit profile"
            onClick={() => navigate(APP_ROUTES.editProfile)}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <FiEdit2 className="text-white text-sm" aria-hidden="true" />
          </button>
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-28">
        {/* Avatar hero */}
        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(145deg,rgba(16,185,129,0.14),rgba(6,10,18,0.96)_38%,rgba(34,211,238,0.1))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
          <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-[24px] bg-emerald-400/20 blur-lg" />
                {getPublicAssetUrl(me?.avatar) ? (
                  <img
                    src={getPublicAssetUrl(me?.avatar) ?? undefined}
                    alt="avatar"
                    className="relative h-[72px] w-[72px] rounded-[24px] object-cover ring-2 ring-white/15"
                  />
                ) : (
                  <div className="relative h-[72px] w-[72px] rounded-[24px] bg-white/8 ring-2 ring-white/15 flex items-center justify-center text-white text-xl font-black">
                    {getAvatarInitials(me?.firstName, me?.lastName, "?")}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-400">
                  <span className="text-[9px] font-black text-slate-950">
                    ✓
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-200">
                    Active
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-300">
                    Profile
                  </span>
                </div>
                <h2 className="text-[15px] font-black leading-tight tracking-tight text-white break-words">
                  {me ? `${me.firstName} ${me.lastName}` : "—"}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-300 break-words">
                  @{me?.username ?? "—"} · Member since{" "}
                  {me ? new Date(me.createdAt).getFullYear() : "—"}
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-2xl border border-yellow-400/15 bg-yellow-400/10 px-2.5 py-2 text-right backdrop-blur-sm">
              <p className="text-[7px] font-bold uppercase tracking-[0.14em] text-yellow-200/70">
                Coins
              </p>
              <div className="mt-1 flex items-center justify-end gap-1 text-yellow-300">
                <FaCoins className="text-[10px] text-yellow-400" />
                <span className="text-[12px] font-black">
                  {(me?.coinsBalance ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {statItems.map(({ icon, label, value, color, glow, surface }) => (
            <div
              key={label}
              className={`relative flex flex-col items-center overflow-hidden rounded-3xl border border-white/8 bg-linear-to-b ${surface} px-2 py-3 text-center ${glow}`}
            >
              <div className="absolute inset-x-4 top-0 h-px bg-white/10" />
              <span className={`mb-1 text-base ${color}`}>{icon}</span>
              <span className="text-base font-black leading-none text-white">
                {value}
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-[0.18em] text-slate-500">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-gray-500">
                Badges
              </p>
              <h3 className="mt-0.5 text-[13px] font-black text-white">
                Gallery
              </h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em] text-slate-400">
              {badgeUnlocked} unlocked
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {badges.map(({ emoji, label, tone, ring, text }, index) => {
              const unlocked = index < badgeUnlocked;

              return (
                <div
                  key={label}
                  className={`group relative overflow-hidden rounded-[14px] border p-2 transition-all ${unlocked ? `${ring} bg-white/5 shadow-[0_8px_18px_rgba(0,0,0,0.12)]` : "border-white/7 bg-white/3 opacity-70"}`}
                >
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${tone} ${unlocked ? "opacity-100" : "opacity-35"}`}
                  />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-slate-950/50 text-sm shadow-inner shadow-black/30">
                      {emoji}
                    </div>
                    <span
                      className={`rounded-full px-1 py-0.5 text-[6px] font-black uppercase tracking-[0.08em] ${unlocked ? "bg-white/10 text-white" : "bg-white/5 text-slate-500"}`}
                    >
                      {unlocked ? "On" : "Off"}
                    </span>
                  </div>

                  <div className="relative mt-2">
                    <p
                      className={`text-[10px] font-black leading-tight ${unlocked ? text : "text-slate-300"}`}
                    >
                      {label}
                    </p>
                    <p className="mt-0.5 text-[8px] leading-snug text-slate-400">
                      {unlocked ? "Milestone reward." : "Play more to unlock."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ label, icon, color, bg, path }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => navigate(path)}
                className={`${bg} border rounded-2xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-all hover:brightness-110`}
              >
                <span className={`text-xl ${color}`} aria-hidden="true">
                  {icon}
                </span>
                <span className="text-sm font-bold text-white">{label}</span>
              </button>
            ))}
            {isAgent && (
              <button
                type="button"
                aria-label="Agent Panel"
                onClick={() => navigate(APP_ROUTES.agentDeposit)}
                className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-all hover:brightness-110"
              >
                <span className="text-xl text-orange-400" aria-hidden="true">
                  <FiSettings />
                </span>
                <span className="text-sm font-bold text-white">
                  Agent Panel
                </span>
              </button>
            )}
          </div>
        </div>

        {/* More */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            More
          </p>
          <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
            {moreItems.map(({ icon, label, sub, path, danger }, i) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                disabled={danger && isSigningOut}
                onClick={() =>
                  danger ? handleSignOut() : path && navigate(path)
                }
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/4 transition-colors text-left disabled:opacity-60 ${i < moreItems.length - 1 ? "border-b border-white/5" : ""}`}
              >
                <span
                  className={`text-sm shrink-0 ${danger ? "text-rose-400" : "text-gray-400"}`}
                >
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${danger ? "text-rose-400" : "text-white"}`}
                  >
                    {danger && isSigningOut ? "Signing Out..." : label}
                  </p>
                  <p className="text-[11px] text-gray-500">{sub}</p>
                </div>
                <FiArrowRight className="text-gray-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Account Info
          </p>
          <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
            {fields.map(({ icon, label, value }, i) => (
              <div
                key={label}
                className={`flex items-center gap-4 px-4 py-3.5 ${i < fields.length - 1 ? "border-b border-white/6" : ""}`}
              >
                <span className="text-gray-500 text-sm shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-white truncate">
                    {value}
                  </p>
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
