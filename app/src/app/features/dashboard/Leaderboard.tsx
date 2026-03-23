import { motion } from "framer-motion";
import { FaCrown, FaMedal, FaTrophy } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import type { LeaderboardUserEntry } from "../../../api/users.api";
import { getAvatarInitials, getPublicAssetUrl } from "../../../lib/assets";
import { useLeaderboard, useMe } from "./hooks";
import { haptic } from "../../../lib/haptic";
import EmptyState from "../../components/ui/EmptyState";
import { SkeletonLeaderRow } from "../../components/ui/Skeletons";

type Tab = "alltime";
const TABS: { id: Tab; label: string }[] = [
  { id: "alltime", label: "All Time" },
];

const PODIUM_COLORS = [
  {
    ring: "ring-yellow-400",
    bg: "bg-yellow-400/20",
    text: "text-yellow-400",
    icon: <FaCrown className="text-yellow-400 text-lg" />,
    size: "w-20 h-20",
    order: "order-2",
    height: "pt-0",
  },
  {
    ring: "ring-gray-300",
    bg: "bg-gray-400/15",
    text: "text-gray-300",
    icon: <FaMedal className="text-gray-300 text-base" />,
    size: "w-16 h-16",
    order: "order-1",
    height: "pt-6",
  },
  {
    ring: "ring-orange-400",
    bg: "bg-orange-400/15",
    text: "text-orange-400",
    icon: <FaMedal className="text-orange-400 text-base" />,
    size: "w-16 h-16",
    order: "order-3",
    height: "pt-6",
  },
];

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function Leaderboard() {
  const navigate = useNavigate();

  const { data: players = [], isLoading } = useLeaderboard(20);
  const { data: me } = useMe();

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);
  const myEntry = players.find(
    (p: LeaderboardUserEntry) => p.user?.id === me?.id,
  );

  const goProfile = (id: string) => {
    haptic.light();
    navigate(`/profile/${id}`);
  };

  const handleProfileOpen = (id?: string) => {
    if (!id) return;
    goProfile(id);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/6 px-5 pt-5 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black text-white">Leaderboard</p>
              <p className="text-[10px] text-gray-500">
                Top players ranked by coins earned
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <FaTrophy className="text-yellow-400 text-sm" />
          </div>
        </div>
        <div className="flex gap-1.5 bg-white/4 border border-white/7 rounded-2xl p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-3 px-5 py-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLeaderRow key={i} />
          ))}
        </div>
      ) : players.length === 0 ? (
        <EmptyState
          type="leaderboard"
          title="No players yet"
          subtitle="Play games to appear on the leaderboard!"
        />
      ) : (
        <div className="flex flex-col gap-4 px-5 pb-8 overflow-y-auto">
          {/* Podium */}
          {top3.length >= 3 && (
            <div className="relative pt-8 pb-2">
              <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-yellow-400/5 to-transparent pointer-events-none rounded-3xl" />
              <div className="flex items-end justify-center gap-3 relative z-10">
                {[top3[1], top3[0], top3[2]].map(
                  (p: LeaderboardUserEntry, idx: number) => {
                    const style = PODIUM_COLORS[idx];
                    const rankNum = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                    return (
                      <button
                        key={p.rank}
                        type="button"
                        onClick={() => handleProfileOpen(p.user?.id)}
                        className={`flex flex-col items-center gap-2 ${style.order} ${style.height} active:scale-95 transition-all`}
                      >
                        <div className="mb-1">{style.icon}</div>
                        <div
                          className={`relative ${style.size} rounded-full ring-2 ${style.ring} overflow-hidden`}
                        >
                          {getPublicAssetUrl(p.user?.avatar) ? (
                            <img
                              src={getPublicAssetUrl(p.user?.avatar) ?? undefined}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/8 flex items-center justify-center text-white text-sm font-black">
                              {getAvatarInitials(
                                p.user?.firstName,
                                p.user?.lastName,
                                "?",
                              )}
                            </div>
                          )}
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 ${style.bg} border border-white/20 rounded-full flex items-center justify-center`}
                          >
                            <span
                              className={`text-[9px] font-black ${style.text}`}
                            >
                              {rankNum}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black text-white leading-tight max-w-[72px] truncate">
                            {p.user?.firstName ?? "—"}
                          </p>
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            <GiCoins className="text-yellow-400 text-[9px]" />
                            <span
                              className={`text-[10px] font-black ${style.text}`}
                            >
                              {fmt(p.totalEarned)}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-20 rounded-t-xl flex items-center justify-center py-1.5 ${style.bg} border-t border-x ${rankNum === 1 ? "h-16 border-yellow-400/30" : "h-10 border-white/10"}`}
                        >
                          <span className={`text-xs font-black ${style.text}`}>
                            #{rankNum}
                          </span>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* Ranked list */}
          {rest.length > 0 && (
            <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
              {rest.map((p: LeaderboardUserEntry, i: number) => (
                <motion.button
                  key={p.rank}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  type="button"
                  onClick={() => handleProfileOpen(p.user?.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 active:bg-white/6 transition-colors text-left ${i < rest.length - 1 ? "border-b border-white/5" : ""}`}
                >
                  <span className="w-6 text-xs font-black text-gray-500 text-center shrink-0">
                    #{p.rank}
                  </span>
                  {getPublicAssetUrl(p.user?.avatar) ? (
                    <img
                      src={getPublicAssetUrl(p.user?.avatar) ?? undefined}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/8 shrink-0 flex items-center justify-center text-white text-xs font-black">
                      {getAvatarInitials(
                        p.user?.firstName,
                        p.user?.lastName,
                        "?",
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {p.user?.firstName} {p.user?.lastName}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      @{p.user?.username} · {p.wins}W
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <GiCoins className="text-yellow-400 text-xs" />
                    <span className="text-xs font-black text-yellow-300">
                      {fmt(p.totalEarned)}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* My rank */}
          {myEntry && (
            <>
              {myEntry.rank > 13 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/6" />
                  <span className="text-[10px] text-gray-600">· · ·</span>
                  <div className="flex-1 h-px bg-white/6" />
                </div>
              )}
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-emerald-400">
                    #{myEntry.rank}
                  </span>
                </div>
                {getPublicAssetUrl(myEntry.user?.avatar) ? (
                  <img
                    src={getPublicAssetUrl(myEntry.user?.avatar) ?? undefined}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/40 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/8 ring-2 ring-emerald-500/40 shrink-0 flex items-center justify-center text-white text-xs font-black">
                    {getAvatarInitials(
                      myEntry.user?.firstName,
                      myEntry.user?.lastName,
                      "?",
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-emerald-400 truncate">
                      {myEntry.user?.firstName} {myEntry.user?.lastName}
                    </p>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
                      YOU
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    @{myEntry.user?.username} · {myEntry.wins}W
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <GiCoins className="text-yellow-400 text-xs" />
                  <span className="text-xs font-black text-yellow-300">
                    {fmt(myEntry.totalEarned)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
