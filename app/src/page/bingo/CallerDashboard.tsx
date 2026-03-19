import { useEffect, useRef } from "react";
import { FaDrum, FaUsers } from "react-icons/fa";
import { FiPause, FiPlay } from "react-icons/fi";
import { MdTimer } from "react-icons/md";
import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
import { AppBar, Avatar, Pill } from "../../components/ui/Layout";
import { BingoBall, getLetter, LETTER_TEXT, NumberBoard, RecentCalls, StatBadge } from "./bingoComponents";
import { useGame } from "../../hooks/useGame";
import { useAuthStore } from "../../store/auth.store";
import { useRoom } from "../../hooks/useRooms";
import { useGameSound } from "../../hooks/useSound";
import { useSoundStore } from "../../store/sound.store";
import { haptic } from "../../lib/haptic";
import { fireSideConfetti } from "../../lib/confetti";
import { announceNumber, cancelAnnouncement } from "../../lib/announcer";

type Props = { roomId: string; isHost?: boolean };

export default function CallerDashboard({ roomId, isHost = false }: Props) {
  const user   = useAuthStore((s) => s.user);
  const { state, startGame, callNext, pauseGame, resumeGame } = useGame();
  const { data: room, refetch } = useRoom(roomId);
  const { play }  = useGameSound();
  const muted     = useSoundStore((s) => s.muted);
  const prevLen   = useRef(0);
  const didWin    = useRef(false);

  const { calledNums, currentNum, remaining, isStarted, isPaused, isFinished, winner, error } = state;

  const players    = room?.players ?? [];
  const maxPlayers = room?.maxPlayers ?? 0;
  const dbCount    = room?._count?.players ?? players.length;
  const liveCount  = state.playerCount > 0 ? state.playerCount : dbCount;
  const canStart   = liveCount >= 1;
  const letter     = currentNum ? getLetter(currentNum) : null;

  // Play ding + speak number on each new call
  useEffect(() => {
    if (calledNums.length > prevLen.current) {
      const latest = calledNums[calledNums.length - 1];
      play("ding");
      haptic.medium();
      announceNumber(latest, muted);
      prevLen.current = calledNums.length;
    }
  }, [calledNums, play, muted]);

  // Confetti + sound on game end
  useEffect(() => {
    if ((isFinished || winner) && !didWin.current) {
      didWin.current = true;
      play("win"); haptic.win(); fireSideConfetti();
    }
  }, [isFinished, winner, play]);

  // Cancel speech on unmount
  useEffect(() => () => cancelAnnouncement(), []);

  if (isFinished || winner) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-5 text-white">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="w-24 h-24 bg-yellow-400/20 border-2 border-yellow-400/40 rounded-full flex items-center justify-center text-5xl shadow-[0_0_60px_rgba(234,179,8,0.3)]"
        >
          🏆
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-3xl font-black">Game Over!</h2>
          {winner ? (
            <p className="text-gray-400 mt-2 text-sm">
              Winner earned <span className="text-yellow-300 font-black">{winner.prize} coins</span>
            </p>
          ) : (
            <p className="text-gray-500 mt-2 text-sm">All {calledNums.length} numbers were called</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={<Avatar src={user?.avatar ?? "https://i.pravatar.cc/40"} name={`Host: ${user?.firstName ?? "You"}`} coins={String(liveCount)} />}
        right={
          <>
            <Pill icon={<FaUsers className="text-emerald-400" />} className="text-emerald-300">{liveCount} Players</Pill>
            <Pill icon={<MdTimer />}>{calledNums.length}/75</Pill>
          </>
        }
      />

      {error && (
        <div className="mx-5 mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2 text-xs text-rose-400 font-semibold text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 px-5 py-5 flex-1">
        {/* Hero ball */}
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Current Call</p>
          {currentNum ? (
            <>
              <motion.div
                key={currentNum}
                initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              >
                <BingoBall n={currentNum} large />
              </motion.div>
              {letter && (
                <motion.div
                  key={`label-${currentNum}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className={`text-sm font-black ${LETTER_TEXT[letter as keyof typeof LETTER_TEXT]}`}>{letter}</span>
                  <span className="text-gray-700">·</span>
                  <span className="text-sm text-gray-400">{calledNums.length} / 75 called</span>
                </motion.div>
              )}
            </>
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-gray-600 text-sm">
              {isStarted ? "—" : "Not started"}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <StatBadge icon="🎯" value={String(calledNums.length)} sub="Called" />
          <StatBadge icon="⏳" value={String(remaining)} sub="Left" />
          <StatBadge icon="👥" value={String(liveCount)} sub="Players" />
        </div>

        {calledNums.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Recent Calls</p>
            <RecentCalls called={calledNums} />
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Number Board</p>
          <NumberBoard called={calledNums} />
        </div>

        {/* Controls */}
        <div className="mt-auto pt-2 flex flex-col gap-2">
          {!isStarted ? (
            <div className="flex flex-col gap-3">
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Players Joined</p>
                  <span className="text-xs font-black text-white">{dbCount} / {maxPlayers}</span>
                </div>
                {players.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-2">Waiting for players to join...</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {players.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2.5">
                        <img
                          src={p.user?.avatar ?? `https://i.pravatar.cc/32?u=${p.user?.id}`}
                          alt={p.user?.username}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {p.user?.firstName} {p.user?.lastName}
                            {p.user?.id === user?.id && <span className="text-emerald-400 ml-1">(You)</span>}
                          </p>
                          <p className="text-[10px] text-gray-500">@{p.user?.username}</p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors text-center"
                >
                  ↻ Refresh
                </button>
              </div>

              {isHost && (
                <Button size="lg" icon={<FiPlay />} onClick={() => { startGame(); play("ding"); haptic.heavy(); }} disabled={!canStart}>
                  Start Game ({liveCount} player{liveCount !== 1 ? "s" : ""})
                </Button>
              )}
            </div>
          ) : (
            <>
              {isHost && (
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    variant="secondary"
                    icon={isPaused ? <FiPlay /> : <FiPause />}
                    onClick={() => { isPaused ? resumeGame() : pauseGame(); haptic.medium(); }}
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button
                    size="lg"
                    icon={<FaDrum />}
                    onClick={() => { callNext(); }}
                    disabled={remaining === 0 || isPaused}
                  >
                    {remaining === 0 ? "All Called!" : "Call Next"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
