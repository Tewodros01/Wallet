import { FiArrowLeft } from "react-icons/fi";

type BingoRoomHeaderProps = {
  roomCode: string;
  isSpectator: boolean;
  onBack: () => void;
};

export default function BingoRoomHeader({
  roomCode,
  isSpectator,
  onBack,
}: BingoRoomHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 pb-3 pt-3.5">
      <button
        type="button"
        aria-label="Go back"
        onClick={onBack}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/15"
      >
        <FiArrowLeft className="text-sm text-white" />
      </button>
      <span className="text-base font-black text-white">Bingo Game</span>
      {isSpectator && (
        <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-300">
          Spectating
        </span>
      )}
      <span className="ml-auto font-mono text-[10px] text-gray-500">
        {roomCode}
      </span>
    </div>
  );
}
