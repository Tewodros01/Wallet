import { FaGamepad } from "react-icons/fa";
import { FiArrowRightCircle } from "react-icons/fi";
import { haptic } from "../../../lib/haptic";
import type { GameRoomDetail } from "../../../types/game.types";

type BingoLobbyHeroProps = {
  rooms: GameRoomDetail[];
  waiting: number;
  playing: number;
  onCreateOpen: () => void;
  onJoinCodeOpen: () => void;
};

export default function BingoLobbyHero({
  rooms,
  waiting,
  playing,
  onCreateOpen,
  onJoinCodeOpen,
}: BingoLobbyHeroProps) {
  const totalPlayers = rooms.reduce(
    (sum, room) => sum + (room._count?.players ?? 0),
    0,
  );
  const biggestPrize = rooms.length
    ? Math.max(...rooms.map((room) => room.prizePool)).toLocaleString()
    : "0";

  return (
    <>
      <div className="relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-emerald-600/35 via-teal-600/18 to-cyan-600/10 p-5">
        <div className="pointer-events-none absolute -right-10 -top-8 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-cyan-400/15 blur-2xl" />
        <span className="absolute right-5 top-4 rotate-6 select-none text-5xl opacity-15">
          🎱
        </span>

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Live Bingo
            </span>
            <span className="text-[10px] font-semibold text-gray-400">
              {waiting} open rooms · {playing} active matches
            </span>
          </div>
          <h1 className="text-2xl font-black leading-tight text-white">
            Join a room.
            <br />
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              Play for the prize.
            </span>
          </h1>
          <p className="mt-2 max-w-[300px] text-xs text-gray-300/80">
            Create your own table or jump into a live room with friends using
            an invite code.
          </p>
        </div>

        <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Open", value: waiting, tone: "text-emerald-300" },
            { label: "Players", value: totalPlayers, tone: "text-cyan-300" },
            { label: "Best Prize", value: biggestPrize, tone: "text-yellow-300" },
          ].map(({ label, value, tone }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 backdrop-blur-sm"
            >
              <p className={`text-sm font-black ${tone}`}>{value}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wide text-gray-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            haptic.light();
            onCreateOpen();
          }}
          className="flex w-full items-center gap-4 rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/18 via-emerald-500/10 to-teal-500/5 p-4 text-left transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/20 shadow-[0_0_18px_rgba(16,185,129,0.18)]">
            <FaGamepad className="text-xl text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-white">Create Room</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Set entry, cards, speed, and invite your players
            </p>
          </div>
          <span className="text-lg text-emerald-400">→</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.light();
            onJoinCodeOpen();
          }}
          className="flex w-full items-center gap-4 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/16 via-sky-500/8 to-white/[0.02] p-4 text-left transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/15 shadow-[0_0_18px_rgba(34,211,238,0.16)]">
            <FiArrowRightCircle className="text-xl text-cyan-300" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-white">Join with Room ID</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Enter an invite code and jump straight into the lobby
            </p>
          </div>
          <span className="text-lg text-cyan-300">→</span>
        </button>
      </div>
    </>
  );
}
