import type { GameRoomDetail } from "../../../types/game.types";

type BingoLobbyStatsStripProps = {
  rooms: GameRoomDetail[];
  waiting: number;
};

export default function BingoLobbyStatsStrip({
  rooms,
  waiting,
}: BingoLobbyStatsStripProps) {
  const totalPlayers = rooms.reduce(
    (sum, room) => sum + (room._count?.players ?? 0),
    0,
  );
  const biggestPrize = rooms.length
    ? Math.max(...rooms.map((room) => room.prizePool)).toLocaleString()
    : "0";

  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Open Rooms", value: waiting, color: "text-emerald-400" },
        { label: "Total Players", value: totalPlayers, color: "text-blue-400" },
        { label: "Biggest Prize", value: biggestPrize, color: "text-yellow-400" },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-0.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] py-3"
        >
          <span className={`text-sm font-black ${color}`}>{value}</span>
          <span className="text-center text-[9px] uppercase tracking-wide text-gray-500">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
