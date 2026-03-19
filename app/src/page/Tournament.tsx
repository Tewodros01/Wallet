import { useEffect, useState } from "react";
import { FaCrown, FaLock, FaTrophy, FaUsers } from "react-icons/fa";
import { FiArrowLeft, FiCheck, FiClock, FiX, FiZap } from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import {
  useJoinTournament,
  usePrizePool,
  useLeaderboard as useTournamentLeaderboard,
  useTournaments,
} from "../hooks/useTournaments";
import { useWalletStore } from "../store/wallet.store";
import type {
  Tournament,
  TournamentLeaderboardEntry,
} from "../types/tournament.types";

type Filter = "all" | "UPCOMING" | "LIVE" | "FINISHED";
type MainTab = "tournaments" | "leaderboard";

function useCountdown(target: string) {
  const calc = () =>
    Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000));
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(t);
  });
  if (secs === 0) return "Starting…";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h > 0 ? `${h}h ` : ""}${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

const GRADIENTS: Record<string, string> = {
  LIVE: "from-rose-500/25 via-orange-500/15 to-yellow-500/5",
  UPCOMING: "from-violet-500/20 via-blue-500/10 to-cyan-500/5",
  FINISHED: "from-gray-500/15 via-gray-500/8 to-transparent",
  CANCELLED: "from-gray-500/10 to-transparent",
};

function JoinModal({
  t,
  onClose,
  onConfirm,
  loading,
}: {
  t: Tournament;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const balance = useWalletStore((s) => s.balance);
  const canAfford = balance >= t.entryFee;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-t-3xl p-5 flex flex-col gap-5">
        <div className="flex justify-center">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Join Tournament</h2>
          <button
            type="button"
            aria-label="Close modal"
            title="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <FiX className="text-gray-400 text-sm" />
          </button>
        </div>

        <div
          className={`bg-gradient-to-br ${GRADIENTS[t.status]} border border-white/10 rounded-2xl p-4 flex items-center gap-3`}
        >
          <FaTrophy className="text-yellow-400 text-2xl shrink-0" />
          <div>
            <p className="text-sm font-black text-white">{t.name}</p>
            <p className="text-xs text-gray-400">{t.subtitle}</p>
          </div>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
          {[
            {
              label: "Entry Fee",
              value:
                t.entryFee === 0
                  ? "Free"
                  : `${t.entryFee.toLocaleString()} coins`,
              yellow: false,
            },
            {
              label: "Prize Pool",
              value: `${fmt(t.prize)} coins`,
              yellow: true,
            },
            {
              label: "Your Balance",
              value: `${balance.toLocaleString()} coins`,
              yellow: false,
            },
            {
              label: "After Joining",
              value: `${(balance - t.entryFee).toLocaleString()} coins`,
              yellow: false,
            },
          ].map(({ label, value, yellow }, i) => (
            <div
              key={label}
              className={`flex justify-between px-4 py-3 ${i < 3 ? "border-b border-white/[0.05]" : ""}`}
            >
              <span className="text-xs text-gray-500">{label}</span>
              <span
                className={`text-xs font-black ${yellow ? "text-yellow-300" : "text-white"}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {!canAfford && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">
            Insufficient balance — need{" "}
            {(t.entryFee - balance).toLocaleString()} more coins
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-gray-400 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canAfford || loading}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-all"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FiCheck /> Confirm & Join
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function TCard({
  t,
  onJoin,
}: {
  t: Tournament;
  onJoin: (t: Tournament) => void;
}) {
  const countdown = useCountdown(t.startsAt);
  const fill = Math.round((t.joinedCount / t.maxPlayers) * 100);
  const full = t.joinedCount >= t.maxPlayers;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${GRADIENTS[t.status] ?? GRADIENTS.UPCOMING} border border-white/[0.08] rounded-3xl p-5 flex flex-col gap-4`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {t.status === "LIVE" && (
            <span className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-rose-400">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />{" "}
              LIVE
            </span>
          )}
          {t.status === "FINISHED" && (
            <span className="bg-gray-500/20 border border-gray-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-gray-500">
              ENDED
            </span>
          )}
          {t.status === "UPCOMING" && (
            <span className="bg-violet-500/20 border border-violet-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-violet-400">
              UPCOMING
            </span>
          )}
          {t.sponsored && (
            <span className="bg-white/10 border border-white/10 rounded-full px-2 py-0.5 text-[9px] font-bold text-gray-400">
              by {t.sponsored}
            </span>
          )}
          {t.isJoined && (
            <span className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2 py-0.5 text-[9px] font-bold text-emerald-400">
              ✓ Joined
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-yellow-400/15 border border-yellow-400/20 rounded-full px-2.5 py-1">
          <GiCoins className="text-yellow-400 text-xs" />
          <span className="text-xs font-black text-yellow-300">
            {fmt(t.prize)}
          </span>
        </div>
      </div>

      <div>
        <p className="text-lg font-black text-white">{t.name}</p>
        {t.subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{t.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: <GiCoins className="text-yellow-400" />,
            label: "Entry",
            value: t.entryFee === 0 ? "Free" : `${t.entryFee}`,
          },
          {
            icon: <FaUsers className="text-blue-400" />,
            label: "Players",
            value: `${t.joinedCount}/${t.maxPlayers}`,
          },
          {
            icon: <FiClock className="text-orange-400" />,
            label:
              t.status === "LIVE"
                ? "In Progress"
                : t.status === "FINISHED"
                  ? "Ended"
                  : "Starts In",
            value: t.status === "FINISHED" ? "—" : countdown,
          },
        ].map(({ icon, label, value }) => (
          <div
            key={label}
            className="bg-black/20 rounded-xl py-2 px-2 flex flex-col gap-0.5"
          >
            <span className="text-xs">{icon}</span>
            <p className="text-xs font-black text-white leading-tight">
              {value}
            </p>
            <p className="text-[9px] text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{t.joinedCount} joined</span>
          <span>{t.maxPlayers - t.joinedCount} spots left</span>
        </div>
        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${fill > 90 ? "bg-rose-400" : "bg-emerald-400"}`}
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>

      {t.status !== "FINISHED" && t.status !== "CANCELLED" && (
        <button
          type="button"
          disabled={full || t.status === "LIVE" || t.isJoined}
          onClick={() => onJoin(t)}
          className={`w-full py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
            t.isJoined
              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-default"
              : t.status === "LIVE"
                ? "bg-rose-500/20 border border-rose-500/30 text-rose-400 cursor-default"
                : full
                  ? "bg-white/[0.05] text-gray-600 cursor-not-allowed"
                  : "bg-white text-gray-950 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          }`}
        >
          {t.isJoined ? (
            <>
              <FiCheck /> Registered
            </>
          ) : t.status === "LIVE" ? (
            <>
              <FiZap /> In Progress
            </>
          ) : full ? (
            <>
              <FaLock /> Full
            </>
          ) : (
            <>Register — {t.entryFee === 0 ? "Free" : `${t.entryFee} coins`}</>
          )}
        </button>
      )}
    </div>
  );
}

export default function Tournament() {
  const navigate = useNavigate();
  const [joining, setJoining] = useState<Tournament | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [mainTab, setMainTab] = useState<MainTab>("tournaments");

  const { data: tournaments = [], isLoading } = useTournaments();
  const { data: prizePoolData } = usePrizePool();
  const { data: leaderboard = [], isLoading: lbLoading } =
    useTournamentLeaderboard();
  const { mutate: joinTournament, isPending } = useJoinTournament();

  const filtered =
    filter === "all"
      ? tournaments
      : tournaments.filter((t) => t.status === filter);
  const liveCount = tournaments.filter((t) => t.status === "LIVE").length;
  const upcomingCount = tournaments.filter(
    (t) => t.status === "UPCOMING",
  ).length;

  const handleConfirmJoin = () => {
    if (!joining) return;
    joinTournament(joining.id, { onSuccess: () => setJoining(null) });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/[0.06] px-5 pt-5 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black text-white">Tournaments</p>
              <p className="text-[10px] text-gray-500">
                {liveCount} live · {upcomingCount} upcoming
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <FaTrophy className="text-yellow-400 text-sm" />
          </div>
        </div>

        <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1">
          {(["tournaments", "leaderboard"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setMainTab(t)}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold capitalize transition-all ${
                mainTab === t ? "bg-emerald-500 text-white" : "text-gray-500"
              }`}
            >
              {t === "tournaments" ? "Tournaments" : "🏆 Leaderboard"}
            </button>
          ))}
        </div>

        {mainTab === "tournaments" && (
          <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1">
            {(["all", "LIVE", "UPCOMING", "FINISHED"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold capitalize transition-all ${
                  filter === f ? "bg-violet-500 text-white" : "text-gray-500"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 pb-10">
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border border-yellow-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <FaCrown className="text-yellow-400 text-xl shrink-0" />
          <div>
            <p className="text-xs font-black text-white">
              Total Active Prize Pool
            </p>
            <p className="text-lg font-black text-yellow-300">
              {prizePoolData ? fmt(prizePoolData.totalPrize) : "—"} coins
            </p>
          </div>
        </div>

        {mainTab === "leaderboard" ? (
          lbLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-white/[0.04] rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-gray-600">
              <FaTrophy className="text-3xl" />
              <p className="text-sm font-semibold">No tournament data yet</p>
            </div>
          ) : (
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
              {leaderboard.map(
                (entry: TournamentLeaderboardEntry, i: number) => (
                  <div
                    key={entry.user?.id ?? i}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < leaderboard.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                        i === 0
                          ? "bg-yellow-400/20 text-yellow-400"
                          : i === 1
                            ? "bg-gray-400/20 text-gray-300"
                            : i === 2
                              ? "bg-orange-400/20 text-orange-400"
                              : "bg-white/[0.06] text-gray-500"
                      }`}
                    >
                      {i === 0
                        ? "🥇"
                        : i === 1
                          ? "🥈"
                          : i === 2
                            ? "🥉"
                            : `#${i + 1}`}
                    </div>
                    <img
                      src={
                        entry.user?.avatar ??
                        `https://i.pravatar.cc/40?u=${entry.user?.id}`
                      }
                      alt={entry.user?.username}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {entry.user?.firstName} {entry.user?.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {entry.tournamentsPlayed} tournament
                        {entry.tournamentsPlayed !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <GiCoins className="text-yellow-400 text-xs" />
                      <span className="text-sm font-black text-yellow-300">
                        {fmt(entry.totalPrize)}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )
        ) : (
          <>
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-white/[0.04] rounded-3xl animate-pulse"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-gray-600">
                <FaTrophy className="text-3xl" />
                <p className="text-sm font-semibold">No tournaments found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((t) => (
                  <TCard key={t.id} t={t} onJoin={setJoining} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {joining && (
        <JoinModal
          t={joining}
          onClose={() => setJoining(null)}
          onConfirm={handleConfirmJoin}
          loading={isPending}
        />
      )}
    </div>
  );
}
