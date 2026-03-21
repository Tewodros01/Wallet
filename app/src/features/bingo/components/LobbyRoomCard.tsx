import { FaCoins, FaLock } from "react-icons/fa";
import { FiGrid, FiUsers, FiZap } from "react-icons/fi";
import type { GameRoomDetail } from "../../../types/game.types";

const statusStyle: Record<string, string> = {
  WAITING: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PLAYING: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  FINISHED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

type LobbyRoomCardProps = {
  room: GameRoomDetail;
  isJoined: boolean;
  rejoining: string | null;
  onJoin: (room: GameRoomDetail) => void;
  onRejoin: (room: GameRoomDetail) => void;
  onSpectate: (room: GameRoomDetail) => void;
};

export default function LobbyRoomCard({
  room,
  isJoined,
  rejoining,
  onJoin,
  onRejoin,
  onSpectate,
}: LobbyRoomCardProps) {
  const canJoin = room.status === "WAITING" && !isJoined;
  const canRejoin =
    isJoined && (room.status === "WAITING" || room.status === "PLAYING");

  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={
              room.host?.avatar ?? `https://i.pravatar.cc/40?u=${room.host?.id}`
            }
            alt={room.host?.username}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10"
          />
          {room.isPrivate && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <FaLock className="text-white text-[8px]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-white truncate">
              {room.name}
            </p>
            <span className="text-[10px] text-gray-600 font-mono shrink-0">
              {room.id.slice(-8).toUpperCase()}
            </span>
            {isJoined && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 shrink-0">
                YOU'RE IN
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500">by {room.host?.username}</p>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
            statusStyle[room.status] ??
            "bg-gray-500/15 text-gray-400 border-gray-500/30"
          }`}
        >
          {room.status}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          {
            icon: <FiUsers className="text-blue-400" />,
            value: `${room._count?.players ?? 0}/${room.maxPlayers}`,
            label: "Players",
          },
          {
            icon: <FaCoins className="text-yellow-400" />,
            value: room.entryFee === 0 ? "Free" : `${room.entryFee}`,
            label: "Entry",
          },
          {
            icon: <FiZap className="text-orange-400" />,
            value: room.speed,
            label: "Speed",
          },
          {
            icon: <FiGrid className="text-violet-400" />,
            value: `${room.cardsPerPlayer}`,
            label: "Cards",
          },
        ].map(({ icon, value, label }) => (
          <div
            key={label}
            className="bg-white/[0.04] rounded-xl py-2 flex flex-col items-center gap-0.5"
          >
            <span className="text-xs">{icon}</span>
            <span className="text-[10px] font-bold text-white">{value}</span>
            <span className="text-[9px] text-gray-600">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🏆</span>
          <div>
            <p className="text-[10px] text-gray-500">Prize Pool</p>
            <p className="text-sm font-black text-yellow-300">
              {room.prizePool === 0
                ? "No prize"
                : `${room.prizePool.toLocaleString()} coins`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {room.status === "PLAYING" && !isJoined && (
            <button
              type="button"
              onClick={() => onSpectate(room)}
              className="px-3 py-2.5 rounded-xl text-xs font-bold bg-violet-500/15 border border-violet-500/25 text-violet-400 hover:bg-violet-500/25 transition-colors"
            >
              👁 Watch
            </button>
          )}
          <button
            type="button"
            disabled={(!canJoin && !canRejoin) || rejoining === room.id}
            onClick={() => (canRejoin ? onRejoin(room) : onJoin(room))}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              canRejoin
                ? "bg-blue-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.35)]"
                : canJoin
                  ? "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                  : "bg-white/[0.05] text-gray-600 cursor-not-allowed"
            }`}
          >
            {rejoining === room.id ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : canRejoin ? (
              "Rejoin →"
            ) : room.status === "FINISHED" ? (
              "Ended"
            ) : room.status === "PLAYING" ? (
              "In Progress"
            ) : (
              "Join →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
