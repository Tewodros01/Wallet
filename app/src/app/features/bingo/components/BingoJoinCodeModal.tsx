import { useState } from "react";
import { FaGamepad } from "react-icons/fa";
import { FiHash, FiX } from "react-icons/fi";
import type { GameRoomDetail } from "../../../../types/game.types";
import Input from "../../../components/ui/Input";

type BingoJoinCodeModalProps = {
  code: string;
  onCodeChange: (value: string) => void;
  onClose: () => void;
  onEntryErrorChange: (value: string | null) => void;
  onResolveRoomCode: (value: string) => Promise<GameRoomDetail | null>;
  onCodeResolved: (room: GameRoomDetail) => Promise<void>;
};

export default function BingoJoinCodeModal({
  code,
  onCodeChange,
  onClose,
  onEntryErrorChange,
  onResolveRoomCode,
  onCodeResolved,
}: BingoJoinCodeModalProps) {
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
      <div className="flex w-full max-w-md flex-col gap-5 rounded-t-3xl border border-white/10 bg-gray-900 p-5">
        <div className="flex justify-center">
          <div className="h-1 w-10 rounded-full bg-white/20" />
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
          >
            <FiX className="text-sm text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/7 bg-white/4 p-4">
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40"
          >
            {isFinding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
