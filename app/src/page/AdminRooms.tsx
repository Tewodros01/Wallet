import { FaGamepad } from "react-icons/fa";
import {
  FiArrowLeft,
  FiClock,
  FiPlay,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import { useRemoveRoom, useRooms } from "../hooks/useRooms";
import type { GameRoomDetail } from "../types";
import { useState } from "react";

export default function AdminRooms() {
  const navigate = useNavigate();
  const [roomToRemove, setRoomToRemove] = useState<GameRoomDetail | null>(null);
  const { data: rooms = [], isLoading } = useRooms({ status: "all" });
  const { mutate: removeRoom, isPending: removingRoom } = useRemoveRoom();

  const activeRooms = rooms.filter(
    (room: GameRoomDetail) =>
      room.status === "WAITING" || room.status === "PLAYING",
  );

  const finishedRooms = rooms.filter(
    (room: GameRoomDetail) => room.status === "FINISHED",
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              title="Go back"
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-white leading-tight">
                Manage Rooms
              </p>
              <p className="text-[10px] text-gray-500">
                {isLoading
                  ? "Loading…"
                  : `${activeRooms.length} active · ${finishedRooms.length} finished`}
              </p>
            </div>
          </div>
        }
        right={
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <FaGamepad className="text-cyan-400 text-sm" />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-12">
        <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-cyan-500/15 via-sky-500/10 to-transparent p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/80">
            Bingo Control
          </p>
          <h1 className="mt-1 text-xl font-black text-white">Manage Rooms</h1>
          <p className="mt-2 text-sm text-gray-300">
            Review live bingo rooms and remove rooms from one place without
            leaving the admin area.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-black text-cyan-300">
            <FaGamepad className="text-sm" />
            Admin room control
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {[
            {
              label: "Active Rooms",
              value: activeRooms.length,
              sub: "waiting or playing",
              icon: <FiPlay />,
              tone: "from-emerald-500 to-teal-500",
              glow: "rgba(16,185,129,0.3)",
            },
            {
              label: "All Rooms",
              value: rooms.length,
              sub: "total listed rooms",
              icon: <FiUsers />,
              tone: "from-blue-500 to-cyan-500",
              glow: "rgba(59,130,246,0.3)",
            },
          ].map(({ label, value, sub, icon, tone, glow }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-xs text-white`}
                style={{ boxShadow: `0 0 10px ${glow}` }}
              >
                {icon}
              </div>
              <div>
                <p className="text-base font-black text-white leading-none">
                  {value}
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-white/70">
                  {label}
                </p>
                <p className="text-[9px] text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Live Rooms
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-white/[0.04] animate-pulse"
                />
              ))}
            </div>
          ) : activeRooms.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-8 text-center">
              <p className="text-sm font-bold text-white">No live rooms</p>
              <p className="mt-1 text-[11px] text-gray-500">
                Open the bingo lobby to create or manage a room.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activeRooms.map((room: GameRoomDetail) => {
                const players = room._count?.players ?? 0;
                return (
                  <div
                    key={room.id}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-left transition-all hover:bg-white/[0.06] active:scale-[0.99]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-cyan-500/10 text-cyan-400 shrink-0">
                      <FaGamepad className="text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">
                        {room.name}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiUsers />
                          {players}/{room.maxPlayers}
                        </span>
                        <span className="flex items-center gap-1 uppercase">
                          <FiClock />
                          {room.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setRoomToRemove(room)}
                        aria-label={`Remove ${room.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 transition-colors hover:bg-rose-500/20"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {roomToRemove && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 px-5 pb-6 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-white/[0.08] bg-gray-900 p-6">
            <div className="text-center">
              <p className="text-base font-black text-white">Remove Room?</p>
              <p className="mt-1 text-sm text-gray-400">
                Delete{" "}
                <span className="font-bold text-white">{roomToRemove.name}</span>{" "}
                from bingo rooms.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setRoomToRemove(null)}
                className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.06] py-3 text-sm font-bold text-gray-400 transition-all active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removingRoom}
                onClick={() =>
                  removeRoom(roomToRemove.id, {
                    onSuccess: () => setRoomToRemove(null),
                  })
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3 text-sm font-black text-white transition-all disabled:opacity-50 active:scale-[0.97]"
              >
                {removingRoom ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <FiTrash2 />
                    Remove
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
