import { useMemo, useState } from "react";
import { FaCoins, FaGamepad } from "react-icons/fa";
import {
  FiArrowLeft,
  FiClock,
  FiEye,
  FiPlay,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useCancelRoom, useFinishRoom, useRemoveRoom, useRooms } from "./hooks";
import { getErrorMessage } from "../../../lib/errors";
import { toast } from "../../../store/toast.store";
import {
  RoomStatus,
  type GameRoomDetail,
  type GameRoomPlayer,
} from "../../../types";
import { AppBar } from "../../components/ui/Layout";

type AdminRoomFilter = "all" | "WAITING" | "PLAYING" | "FINISHED";
type RoomActionType = "cancel" | "finish" | "remove";

const FILTER_LABELS: Record<AdminRoomFilter, string> = {
  all: "All",
  WAITING: "Waiting",
  PLAYING: "Playing",
  FINISHED: "Finished",
};

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function getRoomVisibility(room: GameRoomDetail) {
  return room.isPrivate ? "Private" : "Public";
}

export default function AdminRooms() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AdminRoomFilter>("all");
  const [playersRoom, setPlayersRoom] = useState<GameRoomDetail | null>(null);
  const [actionRoom, setActionRoom] = useState<GameRoomDetail | null>(null);
  const [actionType, setActionType] = useState<RoomActionType | null>(null);

  const { data: rooms = [], isLoading } = useRooms({
    status: "all",
    includeCancelled: true,
  });
  const { mutate: cancelRoom, isPending: cancellingRoom } = useCancelRoom();
  const { mutate: finishRoom, isPending: finishingRoom } = useFinishRoom();
  const { mutate: removeRoom, isPending: removingRoom } = useRemoveRoom();

  const visibleRooms = useMemo(() => {
    if (filter === "all") return rooms;
    if (filter === "FINISHED") {
      return rooms.filter(
        (room: GameRoomDetail) =>
          room.status === RoomStatus.FINISHED ||
          room.status === RoomStatus.CANCELLED,
      );
    }
    return rooms.filter((room: GameRoomDetail) => room.status === filter);
  }, [filter, rooms]);

  const waitingRooms = rooms.filter(
    (room: GameRoomDetail) => room.status === RoomStatus.WAITING,
  );
  const liveRooms = rooms.filter(
    (room: GameRoomDetail) => room.status === RoomStatus.PLAYING,
  );
  const archivedRooms = rooms.filter(
    (room: GameRoomDetail) =>
      room.status === RoomStatus.FINISHED ||
      room.status === RoomStatus.CANCELLED,
  );

  const isMutating = cancellingRoom || finishingRoom || removingRoom;

  const openActionModal = (room: GameRoomDetail, type: RoomActionType) => {
    setActionRoom(room);
    setActionType(type);
  };

  const closeActionModal = () => {
    if (isMutating) return;
    setActionRoom(null);
    setActionType(null);
  };

  const handleAction = () => {
    if (!actionRoom || !actionType) return;

    const onSuccess = () => {
      const message =
        actionType === "cancel"
          ? `${actionRoom.name} was cancelled and player entry fees were refunded.`
          : actionType === "finish"
            ? `${actionRoom.name} was force ended.`
            : `${actionRoom.name} was removed.`;
      toast.success(message);
      setActionRoom(null);
      setActionType(null);
    };

    const onError = (error: unknown) => {
      toast.error(
        getErrorMessage(
          error,
          actionType === "remove"
            ? "Failed to remove room"
            : actionType === "finish"
              ? "Failed to force end room"
              : "Failed to cancel room",
        ),
      );
    };

    if (actionType === "cancel") {
      cancelRoom(actionRoom.id, { onSuccess, onError });
      return;
    }

    if (actionType === "finish") {
      finishRoom(actionRoom.id, { onSuccess, onError });
      return;
    }

    removeRoom(actionRoom.id, { onSuccess, onError });
  };

  const actionMeta =
    actionType === "cancel"
      ? {
          title: "Cancel Room?",
          description:
            "This will cancel the waiting room, mark players as left, and refund any room entry fees already paid.",
          button: "Cancel Room",
          buttonClass: "bg-yellow-500 text-black",
        }
      : actionType === "finish"
        ? {
            title: "Force End Room?",
            description:
              "This will immediately end the live room with no new winner and mark unfinished players as lost.",
            button: "Force End",
            buttonClass: "bg-rose-500 text-white",
          }
        : {
            title: "Remove Room?",
            description:
              "This permanently removes the archived room from the system. Use this only after the room is finished or cancelled.",
            button: "Remove Room",
            buttonClass: "bg-rose-500 text-white",
          };

  const emptyStateCopy =
    filter === "WAITING"
      ? "There are no waiting rooms ready to start."
      : filter === "PLAYING"
        ? "There are no live rooms at the moment."
        : filter === "FINISHED"
          ? "There are no finished or cancelled rooms yet."
          : "There are no rooms in the system right now.";

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
                  : `${liveRooms.length} live · ${archivedRooms.length} archived`}
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
        <div className="rounded-3xl border border-white/7 bg-linear-to-br from-cyan-500/15 via-sky-500/10 to-transparent p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/80">
            Bingo Control
          </p>
          <h1 className="mt-1 text-xl font-black text-white">Manage Rooms</h1>
          <p className="mt-2 text-sm text-gray-300">
            Review room activity, inspect players, cancel waiting rooms, force
            end live games, and remove archived rooms safely.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            {
              label: "Waiting",
              value: waitingRooms.length,
              sub: "ready to start",
              icon: <FiClock />,
              tone: "from-yellow-500 to-amber-500",
              glow: "rgba(234,179,8,0.3)",
            },
            {
              label: "Playing",
              value: liveRooms.length,
              sub: "live now",
              icon: <FiPlay />,
              tone: "from-emerald-500 to-teal-500",
              glow: "rgba(16,185,129,0.3)",
            },
            {
              label: "Archived",
              value: archivedRooms.length,
              sub: "finished or cancelled",
              icon: <FiTrash2 />,
              tone: "from-violet-500 to-purple-500",
              glow: "rgba(139,92,246,0.3)",
            },
          ].map(({ label, value, sub, icon, tone, glow }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-2xl border border-white/7 bg-white/4 px-3 py-3"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br ${tone} text-xs text-white shrink-0`}
                style={{ boxShadow: `0 0 10px ${glow}` }}
              >
                {icon}
              </div>
              <div className="min-w-0">
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

        <div className="mt-5 flex gap-1.5 rounded-2xl border border-white/7 bg-white/4 p-1.5">
          {(["all", "WAITING", "PLAYING", "FINISHED"] as AdminRoomFilter[]).map(
            (value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`flex-1 rounded-xl py-2 text-[10px] font-bold transition-all ${
                  filter === value
                    ? "bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {FILTER_LABELS[value]}
              </button>
            ),
          )}
        </div>

        <div className="mt-5">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
            Room List
          </p>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-white/4 animate-pulse"
                />
              ))}
            </div>
          ) : visibleRooms.length === 0 ? (
            <div className="rounded-2xl border border-white/7 bg-white/4 px-4 py-8 text-center">
              <p className="text-sm font-bold text-white">No rooms found</p>
              <p className="mt-1 text-[11px] text-gray-500">{emptyStateCopy}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleRooms.map((room: GameRoomDetail) => {
                const players =
                  room._count?.players ?? room.players?.length ?? 0;
                const isWaiting = room.status === RoomStatus.WAITING;
                const isPlaying = room.status === RoomStatus.PLAYING;
                const isArchived =
                  room.status === RoomStatus.FINISHED ||
                  room.status === RoomStatus.CANCELLED;

                return (
                  <div
                    key={room.id}
                    className="rounded-2xl border border-white/7 bg-white/4 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-black text-white">
                            {room.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              room.status === RoomStatus.WAITING
                                ? "bg-yellow-500/15 text-yellow-300"
                                : room.status === RoomStatus.PLAYING
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : room.status === RoomStatus.CANCELLED
                                    ? "bg-rose-500/15 text-rose-300"
                                    : "bg-violet-500/15 text-violet-300"
                            }`}
                          >
                            {room.status}
                          </span>
                          <span className="rounded-full bg-white/6 px-2 py-0.5 text-[9px] font-bold text-gray-300">
                            {getRoomVisibility(room)}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                          <p>
                            Host:{" "}
                            <span className="font-bold text-white/90">
                              {room.host
                                ? `${room.host.firstName} ${room.host.lastName}`
                                : "Unknown"}
                            </span>
                          </p>
                          <p>
                            Created:{" "}
                            <span className="font-bold text-white/90">
                              {formatDate(room.createdAt)}
                            </span>
                          </p>
                          <p>
                            Entry Fee:{" "}
                            <span className="font-bold text-yellow-300">
                              <FaCoins className="mr-1 inline text-[9px]" />
                              {room.entryFee.toLocaleString()}
                            </span>
                          </p>
                          <p>
                            Players:{" "}
                            <span className="font-bold text-white/90">
                              {players}/{room.maxPlayers}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPlayersRoom(room)}
                        disabled={isMutating}
                        className="inline-flex items-center gap-1 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-[10px] font-bold text-blue-300 transition-colors hover:bg-blue-500/20"
                      >
                        <FiEye />
                        View Players
                      </button>

                      {isWaiting && (
                        <button
                          type="button"
                          onClick={() => openActionModal(room, "cancel")}
                          disabled={isMutating}
                          className="inline-flex items-center gap-1 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-[10px] font-bold text-yellow-300 transition-colors hover:bg-yellow-500/20"
                        >
                          <FiXCircle />
                          Cancel Room
                        </button>
                      )}

                      {isPlaying && (
                        <button
                          type="button"
                          onClick={() => openActionModal(room, "finish")}
                          disabled={isMutating}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] font-bold text-rose-300 transition-colors hover:bg-rose-500/20"
                        >
                          <FiPlay />
                          Force End
                        </button>
                      )}

                      {isArchived && (
                        <button
                          type="button"
                          onClick={() => openActionModal(room, "remove")}
                          disabled={isMutating}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] font-bold text-rose-300 transition-colors hover:bg-rose-500/20"
                        >
                          <FiTrash2 />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {playersRoom && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 px-5 pb-6 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col gap-5 rounded-3xl border border-white/8 bg-gray-900 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-black text-white">Room Players</p>
                <p className="mt-1 text-sm text-gray-400">{playersRoom.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPlayersRoom(null)}
                className="rounded-xl bg-white/6 px-3 py-1.5 text-xs font-bold text-gray-300"
              >
                Close
              </button>
            </div>

            {!playersRoom.players?.length ? (
              <p className="text-sm text-gray-500">No players in this room.</p>
            ) : (
              <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto">
                {playersRoom.players.map((player: GameRoomPlayer) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {player.user
                          ? `${player.user.firstName} ${player.user.lastName}`
                          : "Unknown player"}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        @{player.user?.username ?? "unknown"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-cyan-300">
                        {player.status}
                      </p>
                      <p className="text-[9px] text-gray-500">
                        Prize: {player.prize.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {actionRoom && actionType && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 px-5 pb-6 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-white/8 bg-gray-900 p-6">
            <div className="text-center">
              <p className="text-base font-black text-white">
                {actionMeta.title}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                <span className="font-bold text-white">{actionRoom.name}</span>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                {actionMeta.description}
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={isMutating}
                className="flex-1 rounded-2xl border border-white/8 bg-white/6 py-3 text-sm font-bold text-gray-400 transition-all active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={handleAction}
                className={`flex-1 rounded-2xl py-3 text-sm font-black transition-all disabled:opacity-50 active:scale-[0.97] ${actionMeta.buttonClass}`}
              >
                {isMutating ? "Working..." : actionMeta.button}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
