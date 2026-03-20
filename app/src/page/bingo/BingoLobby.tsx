import { useState } from "react";
import { FaCoins, FaGamepad, FaLock } from "react-icons/fa";
import {
  FiArrowRightCircle,
  FiBell,
  FiCheck,
  FiGrid,
  FiHash,
  FiSearch,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import CreateRoomModal from "../../components/CreateRoomModal";
import CoinCounter from "../../components/ui/CoinCounter";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import { BottomNav } from "../../components/ui/Layout";
import { SkeletonRoomCard } from "../../components/ui/Skeletons";
import { useUnreadCount } from "../../hooks/useNotifications";
import { useJoinRoom } from "../../hooks/useRooms";
import { getErrorMessage } from "../../lib/errors";
import { haptic } from "../../lib/haptic";
import type {
  GameRoomDetail,
  GameRoomPlayer,
  JoinRoomResponse,
} from "../../types/game.types";

type Filter = "all" | "waiting" | "playing";

const statusStyle: Record<string, string> = {
  WAITING: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PLAYING: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  FINISHED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

function PaymentModal({
  room,
  onConfirm,
  onClose,
}: {
  room: GameRoomDetail;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const { mutate: joinRoom, isPending } = useJoinRoom();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

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
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3">
          <img
            src={
              room.host?.avatar ?? `https://i.pravatar.cc/40?u=${room.host?.id}`
            }
            alt={room.host?.username}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 shrink-0"
          />
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
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
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
              className={`flex items-center justify-between px-4 py-3 ${i < 3 ? "border-b border-white/[0.05]" : ""}`}
            >
              <span className="text-xs text-gray-500">{label}</span>
              <span
                className={`text-xs font-black ${highlight ? "text-yellow-300" : "text-white"}`}
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
            className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-gray-400 text-sm font-bold"
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

function JoinRoomCodeModal({
  code,
  onCodeChange,
  onClose,
  onEntryErrorChange,
  onResolveRoomCode,
  onCodeResolved,
}: {
  code: string;
  onCodeChange: (value: string) => void;
  onClose: () => void;
  onEntryErrorChange: (value: string | null) => void;
  onResolveRoomCode: (value: string) => Promise<GameRoomDetail | null>;
  onCodeResolved: (room: GameRoomDetail) => Promise<void>;
}) {
  const [isFinding, setIsFinding] = useState(false);

  const handleFind = async () => {
    if (!code.trim() || isFinding) return;

    setIsFinding(true);
    try {
      const found = await onResolveRoomCode(code);
      if (!found) {
        onEntryErrorChange("No room matched that code or room ID.");
        return;
      }

      onEntryErrorChange(null);
      onCodeChange(found.id.slice(-8).toUpperCase());
      await onCodeResolved(found);
      onClose();
    } finally {
      setIsFinding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-gray-900 p-5 flex flex-col gap-5">
        <div className="flex justify-center">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Join Room</h2>
            <p className="text-xs text-gray-500">
              Enter the room ID or invite code to continue.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <FiX className="text-gray-400 text-sm" />
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Room ID
          </p>
          <Input
            placeholder="Enter room ID or code"
            leftIcon={<FiHash />}
            value={code}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
          />
          <button
            type="button"
            disabled={!code.trim() || isFinding}
            onClick={() => {
              void handleFind();
            }}
            className="w-full py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-all"
          >
            {isFinding ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FaGamepad />
                Find & Join Room
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomCard({
  room,
  onJoin,
  isJoined,
  onRejoin,
  onSpectate,
  rejoining,
}: {
  room: GameRoomDetail;
  onJoin: (r: GameRoomDetail) => void;
  isJoined: boolean;
  onRejoin: (r: GameRoomDetail) => void;
  onSpectate: (r: GameRoomDetail) => void;
  rejoining: string | null;
}) {
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
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusStyle[room.status] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}
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

interface BingoLobbyProps {
  balance: number;
  search: string;
  filter: Filter;
  code: string;
  showCreate: boolean;
  payRoom: GameRoomDetail | null;
  entryError: string | null;
  roomsData: GameRoomDetail[];
  waiting: number;
  playing: number;
  isLoading: boolean;
  rejoining: string | null;
  userId?: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: Filter) => void;
  onCodeChange: (value: string) => void;
  onCreateOpen: () => void;
  onCreateClose: () => void;
  onEnterCreatedRoom: (room: GameRoomDetail) => Promise<void>;
  onJoinRoom: (room: GameRoomDetail) => void;
  onRejoinRoom: (room: GameRoomDetail) => Promise<void>;
  onSpectateRoom: (room: GameRoomDetail) => void;
  onResolveRoomCode: (value: string) => Promise<GameRoomDetail | null>;
  onCodeResolved: (room: GameRoomDetail) => Promise<void>;
  onPaymentClose: () => void;
  onPaymentConfirm: () => Promise<void>;
  onEntryErrorChange: (value: string | null) => void;
}

export default function BingoLobby({
  balance,
  search,
  filter,
  code,
  showCreate,
  payRoom,
  entryError,
  roomsData,
  waiting,
  playing,
  isLoading,
  rejoining,
  userId,
  onSearchChange,
  onFilterChange,
  onCodeChange,
  onCreateOpen,
  onCreateClose,
  onEnterCreatedRoom,
  onJoinRoom,
  onRejoinRoom,
  onSpectateRoom,
  onResolveRoomCode,
  onCodeResolved,
  onPaymentClose,
  onPaymentConfirm,
  onEntryErrorChange,
}: BingoLobbyProps) {
  const navigate = useNavigate();
  const { data: unreadCount } = useUnreadCount();
  const [showJoinCode, setShowJoinCode] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 pt-5 pb-3 bg-gray-950/90 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
            <FaGamepad className="text-emerald-300 text-lg" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-semibold">
              Bingo lobby
            </p>
            <p className="text-base font-black text-white leading-tight">
              Play Bingo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5">
            <CoinCounter value={balance} />
          </div>
          <button
            type="button"
            aria-label="Notifications"
            title="View notifications"
            onClick={() => navigate("/notifications")}
            className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center relative"
          >
            <FiBell className="text-gray-400 text-sm" aria-hidden="true" />
            {(unreadCount?.count ?? 0) > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-gray-950 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 pb-28">
        {entryError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-sm text-rose-300 font-semibold">
            {entryError}
          </div>
        )}

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-emerald-600/35 via-teal-600/18 to-cyan-600/10 p-5 min-h-[180px] flex flex-col justify-between">
          <div className="absolute -top-8 -right-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-cyan-400/15 blur-2xl pointer-events-none" />
          <span className="absolute top-4 right-5 text-5xl opacity-15 select-none rotate-6">
            🎱
          </span>

          <div className="relative z-10">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
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
              {
                label: "Players",
                value: roomsData.reduce(
                  (sum: number, room: GameRoomDetail) =>
                    sum + (room._count?.players ?? 0),
                  0,
                ),
                tone: "text-cyan-300",
              },
              {
                label: "Best Prize",
                value: roomsData.length
                  ? Math.max(
                      ...roomsData.map((room: GameRoomDetail) => room.prizePool),
                    ).toLocaleString()
                  : "0",
                tone: "text-yellow-300",
              },
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
          className="w-full rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/18 via-emerald-500/10 to-teal-500/5 p-4 flex items-center gap-4 hover:brightness-110 active:scale-[0.98] transition-all text-left"
        >
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(16,185,129,0.18)]">
            <FaGamepad className="text-emerald-400 text-xl" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-white">Create Room</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Set entry, cards, speed, and invite your players
            </p>
          </div>
          <span className="text-emerald-400 text-lg">→</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.light();
            setShowJoinCode(true);
          }}
          className="w-full rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/16 via-sky-500/8 to-white/[0.02] p-4 flex items-center gap-4 hover:brightness-110 active:scale-[0.98] transition-all text-left"
        >
          <div className="w-12 h-12 bg-cyan-500/15 border border-cyan-500/25 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(34,211,238,0.16)]">
            <FiArrowRightCircle className="text-cyan-300 text-xl" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-white">Join with Room ID</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Enter an invite code and jump straight into the lobby
            </p>
          </div>
          <span className="text-cyan-300 text-lg">→</span>
        </button>
        </div>

        <div className="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-500 transition-all">
          <FiSearch className="text-gray-500 shrink-0" />
          <input
            type="text"
            aria-label="Search rooms"
            placeholder="Search rooms, hosts..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "waiting", "playing"] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onFilterChange(value);
                haptic.light();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === value
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "bg-white/[0.05] text-gray-400 hover:bg-white/10"
              }`}
            >
              {value === "all"
                ? `All (${roomsData.length})`
                : value === "waiting"
                  ? `Waiting (${waiting})`
                  : `Playing (${playing})`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Open Rooms", value: waiting, color: "text-emerald-400" },
            {
              label: "Total Players",
              value: roomsData.reduce(
                (sum: number, room: GameRoomDetail) =>
                  sum + (room._count?.players ?? 0),
                0,
              ),
              color: "text-blue-400",
            },
            {
              label: "Biggest Prize",
              value: roomsData.length
                ? Math.max(
                    ...roomsData.map((room: GameRoomDetail) => room.prizePool),
                  ).toLocaleString()
                : "0",
              color: "text-yellow-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3 flex flex-col items-center gap-0.5"
            >
              <span className={`text-sm font-black ${color}`}>{value}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide text-center">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {roomsData.length} Room{roomsData.length !== 1 ? "s" : ""} Found
          </p>
          {isLoading ? (
            [1, 2, 3].map((i) => <SkeletonRoomCard key={i} />)
          ) : roomsData.length === 0 ? (
            <EmptyState
              type="rooms"
              title="No rooms found"
              subtitle="Be the first to create one!"
              action={{
                label: "Create Room",
                onClick: onCreateOpen,
              }}
            />
          ) : (
            roomsData.map((room: GameRoomDetail) => (
              <RoomCard
                key={room.id}
                room={room}
                isJoined={
                  room.players?.some(
                    (player: GameRoomPlayer) => player.user?.id === userId,
                  ) ?? false
                }
                onJoin={onJoinRoom}
                onRejoin={onRejoinRoom}
                onSpectate={onSpectateRoom}
                rejoining={rejoining}
              />
            ))
          )}
        </div>
      </div>

      {showCreate && (
        <CreateRoomModal onClose={onCreateClose} onEnter={onEnterCreatedRoom} />
      )}
      {showJoinCode && (
        <JoinRoomCodeModal
          code={code}
          onCodeChange={onCodeChange}
          onClose={() => setShowJoinCode(false)}
          onEntryErrorChange={onEntryErrorChange}
          onResolveRoomCode={onResolveRoomCode}
          onCodeResolved={onCodeResolved}
        />
      )}
      {payRoom && (
        <PaymentModal
          room={payRoom}
          onClose={onPaymentClose}
          onConfirm={onPaymentConfirm}
        />
      )}
      <BottomNav />
    </div>
  );
}
