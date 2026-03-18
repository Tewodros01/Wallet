import { useState } from "react";
import { FaCoins, FaGamepad, FaLock } from "react-icons/fa";
import { FiCheck, FiGrid, FiHash, FiSearch, FiUsers, FiX, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { AppBar, Avatar, BottomNav } from "../components/ui/Layout";
import { useWalletStore } from "../store/wallet.store";
import { useRooms, useJoinRoom } from "../hooks/useRooms";
import { useMe } from "../hooks/useUser";
import { roomsApi } from "../api/rooms.api";
import { useAuthStore } from "../store/auth.store";

const statusStyle: Record<string, string> = {
  WAITING:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PLAYING:  "bg-orange-500/15 text-orange-400 border-orange-500/30",
  FINISHED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

function PaymentModal({ room, onConfirm, onClose }: { room: any; onConfirm: () => void; onClose: () => void }) {
  const balance = useWalletStore((s) => s.balance);
  const { mutate: joinRoom, isPending } = useJoinRoom();
  const [error, setError] = useState<string | null>(null);
  const canAfford = balance >= room.entryFee;

  const handlePay = () => {
    setError(null);
    joinRoom({ id: room.id }, {
      onSuccess: onConfirm,
      onError: (err: any) => setError(err?.response?.data?.message ?? "Failed to join"),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-t-3xl p-5 flex flex-col gap-5">
        <div className="flex justify-center"><div className="w-10 h-1 bg-white/20 rounded-full" /></div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Confirm & Join</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><FiX className="text-gray-400 text-sm" /></button>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3">
          <img src={room.host?.avatar ?? `https://i.pravatar.cc/40?u=${room.id}`} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">{room.name}</p>
            <p className="text-xs text-gray-500">by {room.host?.username} · {room.id.slice(-8).toUpperCase()}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-400"><FiUsers className="text-[10px]" />{room._count?.players ?? 0}/{room.maxPlayers}</span>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-400">{room.speed}</span>
            </div>
          </div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
          {[
            { label: "Entry Fee",     value: room.entryFee === 0 ? "Free" : `${room.entryFee} coins`,                                    yellow: false },
            { label: "Prize Pool",    value: room.prizePool === 0 ? "—" : `${room.prizePool.toLocaleString()} coins`,                    yellow: true  },
            { label: "Your Balance",  value: `${balance.toLocaleString()} coins`,                                                         yellow: false },
            { label: "After Joining", value: `${(balance - room.entryFee).toLocaleString()} coins`,                                      yellow: false },
          ].map(({ label, value, yellow }, i) => (
            <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < 3 ? "border-b border-white/[0.05]" : ""}`}>
              <span className="text-xs text-gray-500">{label}</span>
              <span className={`text-xs font-black ${yellow ? "text-yellow-300" : "text-white"}`}>{value}</span>
            </div>
          ))}
        </div>
        {!canAfford && <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">Insufficient balance — need {room.entryFee - balance} more coins</div>}
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

function RoomCard({ room, onJoin, isJoined, onRejoin, rejoining }: {
  room: any; onJoin: (r: any) => void; isJoined: boolean; onRejoin: (r: any) => void; rejoining: string | null;
}) {
  const canJoin   = room.status === "WAITING" && !isJoined;
  const canRejoin = isJoined && (room.status === "WAITING" || room.status === "PLAYING");
  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img src={room.host?.avatar ?? `https://i.pravatar.cc/40?u=${room.id}`} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10" />
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
            canRejoin ? "bg-blue-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.35)] hover:bg-blue-400"
            : canJoin  ? "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.35)] hover:bg-emerald-400"
            : "bg-white/[0.05] text-gray-600 cursor-not-allowed"}`}>
          {rejoining === room.id
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            : canRejoin ? "Rejoin →" : room.status === "FINISHED" ? "Ended" : room.status === "PLAYING" ? "In Progress" : "Join →"}
        </button>
      </div>
    </div>
  );
}

export default function JoinRoom() {
  const navigate = useNavigate();
  const balance = useWalletStore((s) => s.balance);
  const { data: me } = useMe();
  const user = useAuthStore((s) => s.user);
  const [code,      setCode]      = useState("");
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<"all" | "waiting" | "playing">("all");
  const [payRoom,   setPayRoom]   = useState<any | null>(null);
  const [joined,    setJoined]    = useState<string | null>(null);
  const [rejoining, setRejoining] = useState<string | null>(null);

  const { data: rooms = [], isLoading } = useRooms({ status: filter === "all" ? undefined : filter, search: search || undefined });

  const codeRoom = rooms.find((r: any) => r.id.slice(-8).toUpperCase() === code.toUpperCase() || r.id === code);

  const handleRejoin = async (room: any) => {
    setRejoining(room.id);
    try {
      await roomsApi.getMyPlayer(room.id);
      navigate("/game");
    } catch {
      navigate("/game");
    } finally {
      setRejoining(null);
    }
  };

  if (joined) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-5 text-white">
      <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
        <FiCheck className="text-emerald-400 text-4xl" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black">Joined!</h2>
        <p className="text-gray-400 mt-1 text-sm">You've joined the room successfully</p>
      </div>
      <Button icon={<FaGamepad />} onClick={() => navigate("/game")}>Go to Game Lobby</Button>
      <button type="button" onClick={() => setJoined(null)} className="text-xs text-gray-600 hover:text-gray-400">Back to rooms</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <FiUsers className="text-emerald-400 text-sm" />
            </div>
            <span className="text-base font-black">Join Room</span>
          </div>
        }
        right={<Avatar src={me?.avatar ?? "https://i.pravatar.cc/40"} name={me?.firstName ?? "—"} coins={balance.toLocaleString()} />}
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-28">
        {/* Join by code */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Join with Room Code</p>
          <Input placeholder="Enter room ID or code" leftIcon={<FiHash />} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <Button disabled={!codeRoom} icon={<FaGamepad />} onClick={() => codeRoom && setPayRoom(codeRoom)}>
            {codeRoom ? `Join "${codeRoom.name}"` : "Find & Join Room"}
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-500 transition-all">
          <FiSearch className="text-gray-500 shrink-0" />
          <input type="text" placeholder="Search rooms, hosts..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600" />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "waiting", "playing"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-gray-400 hover:bg-white/10"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Room list */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{rooms.length} Rooms</p>
          {isLoading ? [1,2,3].map(i => <div key={i} className="h-36 bg-white/[0.04] rounded-2xl animate-pulse" />) :
            rooms.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-gray-600">
                <FaGamepad className="text-3xl" />
                <p className="text-sm font-semibold">No rooms found</p>
              </div>
            ) : rooms.map((room: any) => (
              <RoomCard key={room.id} room={room}
                isJoined={room.players?.some((p: any) => p.user?.id === user?.id) ?? false}
                onJoin={(r) => setPayRoom(r)}
                onRejoin={handleRejoin}
                rejoining={rejoining}
              />
            ))
          }
        </div>
      </div>

      <BottomNav />

      {payRoom && (
        <PaymentModal room={payRoom} onClose={() => setPayRoom(null)} onConfirm={() => { setJoined(payRoom.id); setPayRoom(null); }} />
      )}
    </div>
  );
}
