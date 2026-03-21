import { GiPokerHand } from "react-icons/gi";
import type { GameRoom } from "../../../types";

type LiveRoomCardProps = {
  room: GameRoom;
  onOpen: (room: GameRoom) => void;
};

export default function LiveRoomCard({
  room,
  onOpen,
}: LiveRoomCardProps) {
  const players = room._count?.players ?? 0;
  const fill = Math.round((players / room.maxPlayers) * 100);

  return (
    <button
      type="button"
      aria-label={`Join ${room.name}`}
      onClick={() => onOpen(room)}
      className="w-full bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all text-left"
    >
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-white/[0.08] flex items-center justify-center shrink-0">
        <GiPokerHand className="text-violet-400 text-xl" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-white truncate">{room.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                fill > 80 ? "bg-rose-400" : "bg-emerald-400"
              }`}
              style={{ width: `${fill}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 shrink-0">
            {players}/{room.maxPlayers}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={`text-xs font-black ${
            room.entryFee === 0 ? "text-emerald-400" : "text-yellow-300"
          }`}
        >
          {room.entryFee === 0 ? "FREE" : `${room.entryFee} 🪙`}
        </span>
        {room.prizePool > 0 && (
          <span className="text-[10px] text-gray-500">
            🏆 {room.prizePool.toLocaleString()}
          </span>
        )}
      </div>
    </button>
  );
}
