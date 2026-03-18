import { FaTrophy } from "react-icons/fa";
import { MdTimer } from "react-icons/md";
import Button from "../../components/ui/Button";
import { AppBar, Avatar, Pill } from "../../components/ui/Layout";
import { BingoBall, BingoCard, getLetter, LETTER_TEXT, StatBadge } from "./bingoComponents";
import { useGame } from "../../hooks/useGame";
import { useAuthStore } from "../../store/auth.store";
import { useRoom } from "../../hooks/useRooms";

type Props = { card: number[][] | null; roomId: string; playerCount: number; roomData?: any };

export default function CalledDashboard({ card, roomId, playerCount: initialCount, roomData }: Props) {
  const user = useAuthStore((s) => s.user);
  const { state, markNumber, claimBingo } = useGame();
  const { data: room } = useRoom(roomId, roomData);

  const { calledNums, currentNum, markedNums, card: serverCard, winner, isFinished, error } = state;
  const players  = room?.players ?? [];
  const dbCount  = room?._count?.players ?? players.length ?? initialCount;
  const liveCount = state.playerCount > 0 ? state.playerCount : (dbCount > 0 ? dbCount : initialCount);

  const board  = serverCard ?? card;
  const called = new Set(calledNums);
  const latest = currentNum ?? 0;
  const ll     = latest ? getLetter(latest) : null;

  if (isFinished || winner) {
    const isWinner = winner?.userId === user?.id;
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-5 text-white">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl ${isWinner ? "bg-emerald-500/20 border-2 border-emerald-500/40" : "bg-rose-500/20 border-2 border-rose-500/40"}`}>
          {isWinner ? "🎉" : "😔"}
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black">{isWinner ? "BINGO! You Won!" : "Game Over"}</h2>
          {winner && (
            <p className="text-gray-400 mt-2 text-sm">
              {isWinner ? <span className="text-yellow-300 font-black">+{winner.prize} coins earned!</span> : `Winner earned ${winner.prize} coins`}
            </p>
          )}
          {!winner && <p className="text-gray-500 mt-2 text-sm">All numbers were called</p>}
        </div>
        <div className="text-sm text-gray-500">{calledNums.length} numbers were called</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={<Avatar src={user?.avatar ?? "https://i.pravatar.cc/40"} name={user?.firstName ?? "You"} coins={String(liveCount)} ring="ring-cyan-400" />}
        right={
          <>
            <Pill icon={<MdTimer />}>{calledNums.length}/75</Pill>
            <Pill icon={<FaTrophy className="text-yellow-400" />} className="text-yellow-300">{state.remaining} left</Pill>
          </>
        }
      />

      {error && (
        <div className="mx-5 mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2 text-xs text-rose-400 font-semibold text-center">{error}</div>
      )}

      {!state.isStarted && (
        <div className="mx-5 mt-3 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-xs text-orange-400 font-semibold text-center animate-pulse">
          Waiting for host to start the game...
        </div>
      )}

      <div className="flex flex-col gap-4 px-5 py-5 flex-1">
        {calledNums.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Last Called</p>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {[...calledNums].reverse().slice(0, 6).map((n, i) => (
                <BingoBall key={n} n={n} large={i === 0} dim={i > 0} />
              ))}
            </div>
            {ll && (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black ${LETTER_TEXT[ll as keyof typeof LETTER_TEXT]}`}>{ll} — {latest}</span>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-gray-500">{calledNums.length} called</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <StatBadge icon="✅" value={String(markedNums.size - 1)} sub="Marked" />
          <StatBadge icon="📢" value={String(calledNums.length)} sub="Called" />
          <StatBadge icon="🎯" value={String(75 - calledNums.length)} sub="Left" />
        </div>

        {board ? (
          <div className="flex flex-col gap-1.5 flex-1">
            <BingoCard board={board} marked={markedNums} called={called} latestCall={latest} onToggle={(n) => markNumber(n)} />
            <p className="text-center text-[11px] text-gray-600">Tap a highlighted number to mark it</p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Waiting for card assignment...</div>
        )}

        <div className="pt-1">
          <Button variant="gold" size="lg" onClick={claimBingo} disabled={!state.isStarted || isFinished}>
            🎉 BINGO!
          </Button>
        </div>
      </div>
    </div>
  );
}
