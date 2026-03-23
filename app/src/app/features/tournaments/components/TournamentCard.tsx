import { FaLock, FaUsers } from "react-icons/fa";
import { FiCheck, FiClock, FiZap } from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import type { Tournament } from "../../../../types/tournament.types";
import { useTournamentCountdown } from "../hooks";
import { formatTournamentCompactNumber } from "../utils";

const GRADIENTS: Record<string, string> = {
  LIVE: "from-rose-500/25 via-orange-500/15 to-yellow-500/5",
  UPCOMING: "from-violet-500/20 via-blue-500/10 to-cyan-500/5",
  FINISHED: "from-gray-500/15 via-gray-500/8 to-transparent",
  CANCELLED: "from-gray-500/10 to-transparent",
};

type TournamentCardProps = {
  tournament: Tournament;
  onJoin: (tournament: Tournament) => void;
};

export default function TournamentCard({
  tournament,
  onJoin,
}: TournamentCardProps) {
  const countdown = useTournamentCountdown(tournament.startsAt);
  const fill = Math.round(
    (tournament.joinedCount / tournament.maxPlayers) * 100,
  );
  const full = tournament.joinedCount >= tournament.maxPlayers;

  return (
    <div
      className={`relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/8 bg-linear-to-br p-5 ${GRADIENTS[tournament.status] ?? GRADIENTS.UPCOMING}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tournament.status === "LIVE" && (
            <span className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-black text-rose-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
              LIVE
            </span>
          )}
          {tournament.status === "FINISHED" && (
            <span className="rounded-full border border-gray-500/30 bg-gray-500/20 px-2.5 py-0.5 text-[10px] font-black text-gray-500">
              ENDED
            </span>
          )}
          {tournament.status === "UPCOMING" && (
            <span className="rounded-full border border-violet-500/30 bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-black text-violet-400">
              UPCOMING
            </span>
          )}
          {tournament.sponsored && (
            <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[9px] font-bold text-gray-400">
              by {tournament.sponsored}
            </span>
          )}
          {tournament.isJoined && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
              ✓ Joined
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-400/15 px-2.5 py-1">
          <GiCoins className="text-xs text-yellow-400" />
          <span className="text-xs font-black text-yellow-300">
            {formatTournamentCompactNumber(tournament.prize)}
          </span>
        </div>
      </div>

      <div>
        <p className="text-lg font-black text-white">{tournament.name}</p>
        {tournament.subtitle && (
          <p className="mt-0.5 text-xs text-gray-400">{tournament.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: <GiCoins className="text-yellow-400" />,
            label: "Entry",
            value:
              tournament.entryFee === 0 ? "Free" : `${tournament.entryFee}`,
          },
          {
            icon: <FaUsers className="text-blue-400" />,
            label: "Players",
            value: `${tournament.joinedCount}/${tournament.maxPlayers}`,
          },
          {
            icon: <FiClock className="text-orange-400" />,
            label:
              tournament.status === "LIVE"
                ? "In Progress"
                : tournament.status === "FINISHED"
                  ? "Ended"
                  : "Starts In",
            value: tournament.status === "FINISHED" ? "—" : countdown,
          },
        ].map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-0.5 rounded-xl bg-black/20 px-2 py-2"
          >
            <span className="text-xs">{icon}</span>
            <p className="text-xs font-black leading-tight text-white">
              {value}
            </p>
            <p className="text-[9px] text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{tournament.joinedCount} joined</span>
          <span>
            {tournament.maxPlayers - tournament.joinedCount} spots left
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
          <div
            className={`h-full rounded-full transition-all ${
              fill > 90 ? "bg-rose-400" : "bg-emerald-400"
            }`}
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>

      {tournament.status !== "FINISHED" &&
        tournament.status !== "CANCELLED" && (
          <button
            type="button"
            disabled={
              full || tournament.status === "LIVE" || tournament.isJoined
            }
            onClick={() => onJoin(tournament)}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black transition-all active:scale-[0.98] ${
              tournament.isJoined
                ? "cursor-default border border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                : tournament.status === "LIVE"
                  ? "cursor-default border border-rose-500/30 bg-rose-500/20 text-rose-400"
                  : full
                    ? "cursor-not-allowed bg-white/5 text-gray-600"
                    : "bg-white text-gray-950 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            }`}
          >
            {tournament.isJoined ? (
              <>
                <FiCheck /> Registered
              </>
            ) : tournament.status === "LIVE" ? (
              <>
                <FiZap /> In Progress
              </>
            ) : full ? (
              <>
                <FaLock /> Full
              </>
            ) : (
              <>
                Register —{" "}
                {tournament.entryFee === 0
                  ? "Free"
                  : `${tournament.entryFee} coins`}
              </>
            )}
          </button>
        )}
    </div>
  );
}
