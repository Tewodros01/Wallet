import { useState } from "react";
import { FaLock } from "react-icons/fa";
import { FiCheck, FiUsers, FiX } from "react-icons/fi";
import { useJoinRoom } from "../hooks";
import { getErrorMessage } from "../../../../lib/errors";
import { getAvatarInitials, getPublicAssetUrl } from "../../../../lib/assets";
import type {
  GameRoomDetail,
  JoinRoomResponse,
} from "../../../../types/game.types";
import Input from "../../../components/ui/Input";

type BingoJoinRoomModalProps = {
  room: GameRoomDetail;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export default function BingoJoinRoomModal({
  room,
  onConfirm,
  onClose,
}: BingoJoinRoomModalProps) {
  const { mutate: joinRoom, isPending } = useJoinRoom();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const hostAvatar = getPublicAssetUrl(room.host?.avatar);

  const handlePay = () => {
    setError(null);
    joinRoom(
      { id: room.id, password: room.isPrivate ? password.trim() : undefined },
      {
        onSuccess: (_data: JoinRoomResponse) => {
          onConfirm();
        },
        onError: (err: unknown) => {
          setError(getErrorMessage(err, "Failed to join room"));
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-t-3xl p-5 flex flex-col gap-5">
        <div className="flex justify-center">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Join Room</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <FiX className="text-gray-400 text-sm" />
          </button>
        </div>
        <div className="bg-white/4 border border-white/7 rounded-2xl p-4 flex items-center gap-3">
          {hostAvatar ? (
            <img
              src={hostAvatar}
              alt={room.host?.username}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/8 ring-2 ring-white/10 shrink-0 flex items-center justify-center text-white font-black">
              {getAvatarInitials(room.host?.firstName, room.host?.lastName, "?")}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">{room.name}</p>
            <p className="text-xs text-gray-500">
              Hosted by {room.host?.username} ·{" "}
              {room.id.slice(-8).toUpperCase()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <FiUsers className="text-[10px]" />
                {room._count?.players ?? 0}/{room.maxPlayers}
              </span>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-400">{room.speed} speed</span>
            </div>
          </div>
        </div>
        <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
          {[
            {
              label: "Prize Pool",
              value:
                room.prizePool === 0
                  ? "—"
                  : `${room.prizePool.toLocaleString()} coins`,
              highlight: true,
            },
            {
              label: "Cost Per Card",
              value: room.entryFee === 0 ? "Free" : `${room.entryFee} coins`,
              highlight: false,
            },
          ].map(({ label, value, highlight }, i) => (
            <div
              key={label}
              className={`flex items-center justify-between px-4 py-3 ${i < 3 ? "border-b border-white/5" : ""}`}
            >
              <span className="text-xs text-gray-500">{label}</span>
              <span
                className={`text-xs font-black ${
                  highlight ? "text-yellow-300" : "text-white"
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
        {room.isPrivate && (
          <Input
            placeholder="Enter room password"
            leftIcon={<FaLock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/6 border border-white/10 text-gray-400 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={
              isPending || (room.isPrivate && password.trim().length === 0)
            }
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-all"
          >
            {isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FiCheck />
                Join Room
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
