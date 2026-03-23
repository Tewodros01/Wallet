import { GiCoins } from "react-icons/gi";
import { getAvatarInitials, getPublicAssetUrl } from "../../../../lib/assets";
import type { TournamentLeaderboardEntry } from "../../../../types/tournament.types";
import { formatTournamentCompactNumber } from "../utils";
import TournamentEmptyState from "./TournamentEmptyState";
import TournamentLoadingState from "./TournamentLoadingState";

type TournamentLeaderboardListProps = {
  leaderboard: TournamentLeaderboardEntry[];
  loading: boolean;
};

export default function TournamentLeaderboardList({
  leaderboard,
  loading,
}: TournamentLeaderboardListProps) {
  if (loading) {
    return <TournamentLoadingState count={5} cardHeightClassName="h-16" />;
  }

  if (leaderboard.length === 0) {
    return <TournamentEmptyState title="No tournament data yet" />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/7 bg-white/4">
      {leaderboard.map((entry, i) => (
        <div
          key={entry.user?.id ?? i}
          className={`flex items-center gap-3 px-4 py-3.5 ${
            i < leaderboard.length - 1 ? "border-b border-white/5" : ""
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
              i === 0
                ? "bg-yellow-400/20 text-yellow-400"
                : i === 1
                  ? "bg-gray-400/20 text-gray-300"
                  : i === 2
                    ? "bg-orange-400/20 text-orange-400"
                    : "bg-white/6 text-gray-500"
            }`}
          >
            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
          </div>
          {getPublicAssetUrl(entry.user?.avatar) ? (
            <img
              src={getPublicAssetUrl(entry.user?.avatar) ?? undefined}
              alt={entry.user?.username}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/10"
            />
          ) : (
            <div className="h-9 w-9 shrink-0 rounded-full bg-white/8 ring-2 ring-white/10 flex items-center justify-center text-white text-xs font-black">
              {getAvatarInitials(
                entry.user?.firstName,
                entry.user?.lastName,
                "?",
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {entry.user?.firstName} {entry.user?.lastName}
            </p>
            <p className="text-[10px] text-gray-500">
              {entry.tournamentsPlayed} tournament
              {entry.tournamentsPlayed !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <GiCoins className="text-xs text-yellow-400" />
            <span className="text-sm font-black text-yellow-300">
              {formatTournamentCompactNumber(entry.totalPrize)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
