import { FaCoins, FaGamepad, FaMedal, FaTrophy } from "react-icons/fa";
import { FiArrowLeft, FiUser } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/users.api";
import { useAuthStore } from "../store/auth.store";

const badges = [
  { emoji: "🏆", label: "First Win" },
  { emoji: "🎯", label: "Sharp Eye" },
  { emoji: "🔥", label: "Hot Streak" },
  { emoji: "⚡", label: "Speed King" },
  { emoji: "💎", label: "Diamond" },
  { emoji: "🎱", label: "Bingo Pro" },
];

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);

  // redirect to own profile if same user
  if (id === me?.id) {
    navigate("/profile", { replace: true });
  }

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["users", id, "stats"],
    queryFn: () => usersApi.getStatsByUserId(id!),
    enabled: !!id,
  });

  const statItems = [
    { icon: <FaGamepad />, label: "Games",    value: String(stats?.totalGames ?? "—"), color: "text-rose-400"    },
    { icon: <FaTrophy />,  label: "Wins",     value: String(stats?.wins ?? "—"),       color: "text-yellow-400"  },
    { icon: <FaMedal />,   label: "Win Rate", value: stats ? `${stats.winRate}%` : "—", color: "text-emerald-400" },
    { icon: <FaCoins />,   label: "Earned",   value: stats ? `${(stats.totalEarned / 1000).toFixed(1)}k` : "—", color: "text-cyan-400" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-gray-950/95 border-b border-white/[0.06] sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <FiArrowLeft className="text-white text-sm" />
          </button>
          <span className="text-base font-black">Player Profile</span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
          <FiUser className="text-gray-400 text-sm" />
        </div>
      </div>

      {loadingUser ? (
        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="h-48 bg-white/[0.04] rounded-2xl animate-pulse" />
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white/[0.04] rounded-2xl animate-pulse" />)}
          </div>
        </div>
      ) : !user ? (
        <div className="flex flex-col items-center gap-3 py-24 text-gray-600">
          <FiUser className="text-3xl" />
          <p className="text-sm font-semibold">User not found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-5 py-5 pb-10">
          {/* Avatar hero */}
          <div className="bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20 rounded-2xl p-6 flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={user.avatar ?? `https://i.pravatar.cc/80?u=${user.id}`}
                alt={user.username}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-violet-500/40"
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-white">{user.firstName} {user.lastName}</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                @{user.username} · Member since {new Date(user.createdAt).getFullYear()}
              </p>
              {user.bio && <p className="text-xs text-gray-500 mt-2 max-w-xs">{user.bio}</p>}
            </div>
            <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-1.5">
              <FaCoins className="text-yellow-400 text-xs" />
              <span className="text-yellow-300 text-sm font-black">{(user.coinsBalance ?? 0).toLocaleString()} coins</span>
            </div>
          </div>

          {/* Stats */}
          {loadingStats ? (
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white/[0.04] rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {statItems.map(({ icon, label, value, color }) => (
                <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3 flex flex-col items-center gap-1">
                  <span className={`text-base ${color}`}>{icon}</span>
                  <span className="text-base font-black text-white leading-none">{value}</span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>
          )}

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
        </div>
      )}
    </div>
  );
}
