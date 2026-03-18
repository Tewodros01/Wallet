import { useState } from "react";
import { FaCoins, FaGamepad, FaLock } from "react-icons/fa";
import {
  FiArrowLeft,
  FiCheck,
  FiGrid,
  FiRadio,
  FiSearch,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { roomsApi } from "../api/rooms.api";
import CreateRoomModal from "../components/CreateRoomModal";
import { GameProvider } from "../hooks/GameProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useJoinRoom, useRooms, roomKeys } from "../hooks/useRooms";
import { useAuthStore } from "../store/auth.store";
import { useWalletStore } from "../store/wallet.store";
import CalledDashboard from "./bingo/CalledDashboard";
import CallerDashboard from "./bingo/CallerDashboard";
import CardSelector from "./bingo/CardSelector";

type GameView = "player" | "caller";
type Filter = "all" | "waiting" | "playing";

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  room,
  onConfirm,
  onClose,
}: {
  room: any;
  onConfirm: (card: number[][]) => void;
  onClose: () => void;
}) {
  const balance = useWalletStore((s) => s.balance);
  const { mutate: joinRoom, isPending } = useJoinRoom();
  const [error, setError] = useState<string | null>(null);
  const canAfford = balance >= room.entryFee;

  const handlePay = () => {
    setError(null);
    joinRoom(
      { id: room.id },
      {
        onSuccess: (data: any) => {
          const board = data.card?.board as number[][] | undefined;
          onConfirm(board ?? []);
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message ?? "Failed to join room");
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
          <button type="button" aria-label="Close" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <FiX className="text-gray-400 text-sm" />
          </button>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3">
          <img src={room.host?.avatar ?? `https://i.pravatar.cc/40?u=${room.host?.id}`} alt={room.host?.username} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">{room.name}</p>
            <p className="text-xs text-gray-500">Hosted by {room.host?.username} · {room.id.slice(-8).toUpperCase()}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-400"><FiUsers className="text-[10px]" />{room._count?.players ?? 0}/{room.maxPlayers}</span>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-400">{room.speed} speed</span>
            </div>
          </div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
          {[
            { label: "Entry Fee",     value: room.entryFee === 0 ? "Free" : `${room.entryFee} coins`,                highlight: false },
            { label: "Prize Pool",    value: room.prizePool === 0 ? "—" : `${room.prizePool.toLocaleString()} coins`, highlight: true  },
            { label: "Your Balance",  value: `${balance.toLocaleString()} coins`,                                     highlight: false },
            { label: "After Joining", value: room.entryFee === 0 ? `${balance.toLocaleString()} coins` : `${(balance - room.entryFee).toLocaleString()} coins`, highlight: false },
          ].map(({ label, value, highlight }, i) => (
            <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < 3 ? "border-b border-white/[0.05]" : ""}`}>
              <span className="text-xs text-gray-500">{label}</span>
              <span className={`text-xs font-black ${highlight ? "text-yellow-300" : "text-white"}`}>{value}</span>
            </div>
          ))}
        </div>
        {!canAfford && <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">Insufficient balance — you need {room.entryFee - balance} more coins</div>}
        {error && <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">{error}</div>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-gray-400 text-sm font-bold">Cancel</button>
          <button type="button" onClick={handlePay} disabled={!canAfford || isPending}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-all">
            {isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiCheck />{room.entryFee === 0 ? "Join Free" : `Pay ${room.entryFee} & Join`}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Room Card ────────────────────────────────────────────────────────────────
const statusStyle: Record<string, string> = {
  WAITING:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PLAYING:  "bg-orange-500/15 text-orange-400 border-orange-500/30",
  FINISHED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

function RoomCard({ room, onJoin, isJoined, onRejoin, rejoining }: {
  room: any; onJoin: (r: any) => void; isJoined: boolean; onRejoin: (r: any) => void; rejoining: string | null;
}) {
  const canJoin   = room.status === "WAITING" && !isJoined;
  const canRejoin = isJoined && (room.status === "WAITING" || room.status === "PLAYING");
  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img src={room.host?.avatar ?? `https://i.pravatar.cc/40?u=${room.host?.id}`} alt={room.host?.username} className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10" />
          {room.isPrivate && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"><FaLock className="text-white text-[8px]" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-white truncate">{room.name}</p>
            <span className="text-[10px] text-gray-600 font-mono shrink-0">{room.id.slice(-8).toUpperCase()}</span>
            {isJoined && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 shrink-0">YOU'RE IN</span>}
          </div>
          <p className="text-[11px] text-gray-500">by {room.host?.username}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusStyle[room.status] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>{room.status}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { icon: <FiUsers className="text-blue-400" />,   value: `${room._count?.players ?? 0}/${room.maxPlayers}`, label: "Players" },
          { icon: <FaCoins className="text-yellow-400" />, value: room.entryFee === 0 ? "Free" : `${room.entryFee}`, label: "Entry"   },
          { icon: <FiZap className="text-orange-400" />,   value: room.speed,                                         label: "Speed"   },
          { icon: <FiGrid className="text-violet-400" />,  value: `${room.cardsPerPlayer}`,                           label: "Cards"   },
        ].map(({ icon, value, label }) => (
          <div key={label} className="bg-white/[0.04] rounded-xl py-2 flex flex-col items-center gap-0.5">
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
            <p className="text-sm font-black text-yellow-300">{room.prizePool === 0 ? "No prize" : `${room.prizePool.toLocaleString()} coins`}</p>
          </div>
        </div>
        <button type="button" disabled={(!canJoin && !canRejoin) || rejoining === room.id}
          onClick={() => canRejoin ? onRejoin(room) : onJoin(room)}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
            canRejoin ? "bg-blue-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.35)]"
            : canJoin  ? "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.35)]"
            : "bg-white/[0.05] text-gray-600 cursor-not-allowed"}`}>
          {rejoining === room.id
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            : canRejoin ? "Rejoin →" : room.status === "FINISHED" ? "Ended" : room.status === "PLAYING" ? "In Progress" : "Join →"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Screen = "lobby" | "card-select" | "game";

export default function BingoGame() {
  const navigate  = useNavigate();
  const balance   = useWalletStore((s) => s.balance);
  const user      = useAuthStore((s) => s.user);

  const [screen,     setScreen]     = useState<Screen>("lobby");
  const [gameView,   setGameView]   = useState<GameView>("player");
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState<Filter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [payRoom,    setPayRoom]    = useState<any | null>(null);
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [playerCard, setPlayerCard] = useState<number[][] | null>(null);
  const [rejoining,  setRejoining]  = useState<string | null>(null);
  const [roomCount,  setRoomCount]  = useState(0);

  const { data: roomsData = [], isLoading } = useRooms({
    status: filter === "all" ? undefined : filter,
    search: search || undefined,
  });
  const qc = useQueryClient();

  const seedRoom = (room: any) => qc.setQueryData(roomKeys.one(room.id), room);

  const waiting = roomsData.filter((r: any) => r.status === "WAITING").length;
  const playing = roomsData.filter((r: any) => r.status === "PLAYING").length;
  const isHost  = activeRoom?.host?.id === user?.id;

  const handleRejoin = async (room: any) => {
    setRejoining(room.id);
    try {
      const player = await roomsApi.getMyPlayer(room.id);
      seedRoom(room);
      setActiveRoom(room);
      setPlayerCard(player.card?.board ?? null);
      setRoomCount(room._count?.players ?? room.players?.length ?? 0);
      setScreen("game");
    } catch {
      seedRoom(room);
      setActiveRoom(room);
      setPlayerCard(null);
      setRoomCount(room._count?.players ?? room.players?.length ?? 0);
      setScreen("game");
    } finally {
      setRejoining(null);
    }
  };

  // ── Card select screen ──
  if (screen === "card-select") {
    return (
      <CardSelector
        card={playerCard}
        onConfirm={() => setScreen("game")}
        onBack={() => setScreen("lobby")}
      />
    );
  }

  // ── Game screen ──
  if (screen === "game" && activeRoom) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-xl border-b border-white/[0.07]">
          <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
            <button type="button" aria-label="Go back" onClick={() => setScreen("lobby")}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors shrink-0">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <span className="text-base font-black text-white">Bingo Game</span>
            <span className="ml-auto text-[10px] text-gray-500 font-mono">{activeRoom.id.slice(-8).toUpperCase()}</span>
          </div>
          {/* Tabs — both visible to everyone */}
          <div className="flex gap-2 px-4 pb-3">
            {([
              { id: "player" as GameView, label: "Player", Icon: FiUser  },
              { id: "caller" as GameView, label: "Caller", Icon: FiRadio },
            ]).map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => setGameView(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  gameView === id
                    ? "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                    : "bg-white/[0.05] text-gray-400 hover:bg-white/10"
                }`}>
                <Icon className="text-sm" />{label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <GameProvider roomId={activeRoom.id}>
            {gameView === "player" && <CalledDashboard card={playerCard} roomId={activeRoom.id} playerCount={roomCount} roomData={activeRoom} />}
            {gameView === "caller" && <CallerDashboard roomId={activeRoom.id} isHost={isHost} />}
          </GameProvider>
        </div>
      </div>
    );
  }

  // ── Lobby screen ──
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/[0.07] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Go back" onClick={() => navigate("/dashboard")}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
            <FiArrowLeft className="text-white text-sm" />
          </button>
          <div>
            <span className="text-base font-black text-white">Play Bingo</span>
            <p className="text-[10px] text-gray-500">{waiting} waiting · {playing} in progress</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1.5">
          <FaCoins className="text-yellow-400 text-xs" />
          <span className="text-yellow-300 text-xs font-black">{balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 pb-28">
        <button type="button" onClick={() => setShowCreate(true)}
          className="w-full bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4 hover:brightness-110 active:scale-[0.98] transition-all text-left">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center shrink-0">
            <FaGamepad className="text-emerald-400 text-xl" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-white">Create Your Room</p>
            <p className="text-xs text-gray-400 mt-0.5">Set entry fee, cards, speed & more</p>
          </div>
          <span className="text-emerald-400 text-lg">→</span>
        </button>

        <div className="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-500 transition-all">
          <FiSearch className="text-gray-500 shrink-0" />
          <input type="text" placeholder="Search rooms, hosts..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600" />
        </div>

        <div className="flex gap-2">
          {(["all", "waiting", "playing"] as Filter[]).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === f ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]" : "bg-white/[0.05] text-gray-400 hover:bg-white/10"}`}>
              {f === "all" ? `All (${roomsData.length})` : f === "waiting" ? `Waiting (${waiting})` : `Playing (${playing})`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Open Rooms",    value: waiting,                                                                   color: "text-emerald-400" },
            { label: "Total Players", value: roomsData.reduce((s: number, r: any) => s + (r._count?.players ?? 0), 0), color: "text-blue-400"    },
            { label: "Biggest Prize", value: roomsData.length ? Math.max(...roomsData.map((r: any) => r.prizePool)).toLocaleString() : "0", color: "text-yellow-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3 flex flex-col items-center gap-0.5">
              <span className={`text-sm font-black ${color}`}>{value}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide text-center">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{roomsData.length} Room{roomsData.length !== 1 ? "s" : ""} Found</p>
          {isLoading ? (
            [1, 2, 3].map((i) => <div key={i} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl h-36 animate-pulse" />)
          ) : roomsData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-600">
              <FaGamepad className="text-3xl" />
              <p className="text-sm font-semibold">No rooms found</p>
            </div>
          ) : (
            roomsData.map((room: any) => (
              <RoomCard key={room.id} room={room}
                isJoined={room.players?.some((p: any) => p.user?.id === user?.id) ?? false}
                onJoin={(r) => setPayRoom(r)}
                onRejoin={handleRejoin}
                rejoining={rejoining}
              />
            ))
          )}
        </div>
      </div>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onEnter={async (roomId) => {
            const created = roomsData.find((r: any) => r.id === roomId);
            const roomObj = created ?? { id: roomId, host: { id: user?.id }, name: "My Room" };
            seedRoom(roomObj);
            setActiveRoom(roomObj);
            setRoomCount(roomObj._count?.players ?? roomObj.players?.length ?? 1);
            try {
              const player = await roomsApi.getMyPlayer(roomId);
              setPlayerCard(player.card?.board ?? null);
            } catch {
              setPlayerCard(null);
            }
            setScreen("game");
          }}
        />
      )}
      {payRoom && (
        <PaymentModal
          room={payRoom}
          onClose={() => setPayRoom(null)}
          onConfirm={(card) => {
            seedRoom(payRoom);
            setActiveRoom(payRoom);
            setRoomCount((payRoom._count?.players ?? payRoom.players?.length ?? 0) + 1);
            setPlayerCard(card);
            setPayRoom(null);
            setScreen("card-select");
          }}
        />
      )}
    </div>
  );
}
