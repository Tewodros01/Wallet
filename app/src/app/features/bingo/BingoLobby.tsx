import { useState } from "react";
import { FaGamepad } from "react-icons/fa";
import { FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { useUnreadCount } from "./hooks";
import { haptic } from "../../../lib/haptic";
import type { GameRoomDetail, GameRoomPlayer } from "../../../types/game.types";
import CoinCounter from "../../components/ui/CoinCounter";
import { BottomNav } from "../../components/ui/Layout";
import CreateRoomModal from "./components/CreateRoomModal";
import BingoJoinCodeModal from "./components/BingoJoinCodeModal";
import BingoJoinRoomModal from "./components/BingoJoinRoomModal";
import BingoLobbyFilters from "./components/BingoLobbyFilters";
import BingoLobbyHero from "./components/BingoLobbyHero";
import BingoLobbyStatsStrip from "./components/BingoLobbyStatsStrip";
import BingoStatePanel from "./components/BingoStatePanel";
import LobbyRoomCard from "./components/LobbyRoomCard";

type Filter = "all" | "waiting" | "playing";

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
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 pt-5 pb-3 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
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
            onClick={() => navigate(APP_ROUTES.notifications)}
            className="w-9 h-9 rounded-full bg-white/6 border border-white/8 flex items-center justify-center relative"
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

        <BingoLobbyHero
          rooms={roomsData}
          onCreateOpen={onCreateOpen}
          onJoinCodeOpen={() => setShowJoinCode(true)}
        />

        <BingoLobbyStatsStrip rooms={roomsData} waiting={waiting} />

        <BingoLobbyFilters
          search={search}
          filter={filter}
          total={roomsData.length}
          waiting={waiting}
          playing={playing}
          onSearchChange={onSearchChange}
          onFilterChange={onFilterChange}
          onFilterTap={() => haptic.light()}
        />

        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {roomsData.length} Room{roomsData.length !== 1 ? "s" : ""} Found
          </p>
          {isLoading ? (
            <BingoStatePanel mode="loading" />
          ) : roomsData.length === 0 ? (
            <BingoStatePanel
              mode="empty"
              title="No rooms found"
              subtitle="Be the first to create one!"
              action={{
                label: "Create Room",
                onClick: onCreateOpen,
              }}
            />
          ) : (
            roomsData.map((room: GameRoomDetail) => (
              <LobbyRoomCard
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
        <BingoJoinCodeModal
          code={code}
          onCodeChange={onCodeChange}
          onClose={() => setShowJoinCode(false)}
          onEntryErrorChange={onEntryErrorChange}
          onResolveRoomCode={onResolveRoomCode}
          onCodeResolved={onCodeResolved}
        />
      )}
      {payRoom && (
        <BingoJoinRoomModal
          room={payRoom}
          onClose={onPaymentClose}
          onConfirm={onPaymentConfirm}
        />
      )}
      <BottomNav />
    </div>
  );
}
