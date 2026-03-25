import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import { FiArrowLeft, FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getAvatarInitials, getPublicAssetUrl } from "../../../lib/assets";
import { AppBar } from "../../components/ui/Layout";
import { useGameHistory, useMyStats } from "./hooks";
import type { GameHistoryItem } from "../../../types/game-history.types";

const FILTERS = ["All", "Wins", "Losses"] as const;
type Filter = (typeof FILTERS)[number];

export default function GameHistory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("All");

  const { data: history = [], isLoading } = useGameHistory();
  const { data: stats } = useMyStats();

  const filtered = history.filter((g: GameHistoryItem) =>
    filter === "All"
      ? true
      : filter === "Wins"
        ? g.result === "WIN"
        : g.result === "LOSS",
  );

  const summary = [
    {
      label: "Games",
      value: String(stats?.totalGames ?? history.length),
      color: "text-white",
    },
    {
      label: "Wins",
      value: String(stats?.wins ?? "—"),
      color: "text-yellow-400",
    },
    {
      label: "Win Rate",
      value: stats ? `${stats.winRate}%` : "—",
      color: "text-emerald-400",
    },
    {
      label: "Earned",
      value: stats ? `${(stats.totalEarned / 1000).toFixed(1)}k` : "—",
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <span className="text-base font-black">Game History</span>
          </div>
        }
        right={
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
            <FiClock className="text-violet-400 text-sm" />
          </div>
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-2">
          {summary.map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white/4 border border-white/7 rounded-2xl py-3 flex flex-col items-center gap-1"
            >
              <span className={`text-base font-black leading-none ${color}`}>
                {value}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Win rate bar */}
        {stats && (
          <div className="bg-white/4 border border-white/7 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">
                Win Rate
              </span>
              <span className="text-xs font-black text-emerald-400">
                {stats.winRate}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full"
                style={{ width: `${stats.winRate}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>{stats.wins} wins</span>
              <span>{stats.losses} losses</span>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f
                  ? "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Game list */}
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/4 border border-white/7 rounded-2xl p-4 h-20 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/4 border border-white/7 rounded-2xl p-8 text-center text-gray-600 text-sm">
            No games found
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((g: GameHistoryItem) => (
              <div
                key={g.roomId}
                className="bg-white/4 border border-white/7 rounded-2xl p-4 flex items-center gap-3"
              >
                {getPublicAssetUrl(g.room.host?.avatar) ? (
                  <img
                    src={getPublicAssetUrl(g.room.host?.avatar) ?? undefined}
                    alt={g.room.host?.username}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/8 ring-2 ring-white/10 shrink-0 flex items-center justify-center text-white text-xs font-black">
                    {getAvatarInitials(
                      g.room.host?.username,
                      "",
                      "?",
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-white truncate">
                      {g.room.name}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono shrink-0">
                      {g.roomId.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span>👥 {g.room._count?.players ?? "?"} players</span>
                    <span>
                      {new Date(g.joinedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      g.result === "WIN"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {g.result}
                  </span>
                  {g.result === "WIN" && g.prize > 0 && (
                    <span className="flex items-center gap-1 text-xs text-yellow-400 font-black">
                      <FaCoins className="text-[10px]" />+{g.prize}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
