import { FaGamepad } from "react-icons/fa";
import { FiArrowRightCircle } from "react-icons/fi";
import { haptic } from "../../../../lib/haptic";
import type { GameRoomDetail } from "../../../../types/game.types";

type BingoLobbyHeroProps = {
  rooms: GameRoomDetail[];
  onCreateOpen: () => void;
  onJoinCodeOpen: () => void;
};

export default function BingoLobbyHero({
  rooms,
  onCreateOpen,
  onJoinCodeOpen,
}: BingoLobbyHeroProps) {
  const totalPlayers = rooms.reduce(
    (sum, room) => sum + (room._count?.players ?? 0),
    0,
  );

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600/40 via-emerald-600/20 to-cyan-600/20 border border-white/8 p-5 min-h-[160px] flex flex-col justify-between mt-4">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <span className="absolute top-4 right-16 text-4xl opacity-20 select-none rotate-12">
          🎱
        </span>
        <span className="absolute bottom-6 right-6 text-5xl opacity-15 select-none -rotate-6">
          🎰
        </span>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-rose-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
              Live Now
            </span>
            <span className="text-[10px] text-gray-500 font-semibold">
              {totalPlayers} players online
            </span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">
            Create a room.
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">
              Join and call BINGO.
            </span>
          </h1>
          <p className="mt-2 max-w-[320px] text-xs text-gray-300/80">
            Start your own table or jump in with a room ID and play for the
            prize.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onCreateOpen();
            }}
            className="flex items-center gap-2 bg-emerald-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            <FaGamepad className="text-base" />
            Create Room
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onJoinCodeOpen();
            }}
            className="flex items-center gap-2 bg-cyan-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)]"
          >
            <FiArrowRightCircle className="text-base" />
            Join with ID
          </button>
        </div>
      </div>
    </>
  );
}
