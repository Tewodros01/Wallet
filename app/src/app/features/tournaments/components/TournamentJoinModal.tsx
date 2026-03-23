import { FaTrophy } from "react-icons/fa";
import { FiCheck, FiX } from "react-icons/fi";
import { useWalletStore } from "../../../../store/wallet.store";
import type { Tournament } from "../../../../types/tournament.types";
import { formatTournamentCompactNumber } from "../utils";

const GRADIENTS: Record<string, string> = {
  LIVE: "from-rose-500/25 via-orange-500/15 to-yellow-500/5",
  UPCOMING: "from-violet-500/20 via-blue-500/10 to-cyan-500/5",
  FINISHED: "from-gray-500/15 via-gray-500/8 to-transparent",
  CANCELLED: "from-gray-500/10 to-transparent",
};

type TournamentJoinModalProps = {
  tournament: Tournament;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

export default function TournamentJoinModal({
  tournament,
  onClose,
  onConfirm,
  loading,
}: TournamentJoinModalProps) {
  const balance = useWalletStore((s) => s.balance);
  const canAfford = balance >= tournament.entryFee;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-t-3xl border border-white/10 bg-gray-900 p-5">
        <div className="flex justify-center">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Join Tournament</h2>
          <button
            type="button"
            aria-label="Close modal"
            title="Close modal"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
          >
            <FiX className="text-sm text-gray-400" />
          </button>
        </div>

        <div
          className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-linear-to-br ${GRADIENTS[tournament.status]} p-4`}
        >
          <FaTrophy className="shrink-0 text-2xl text-yellow-400" />
          <div>
            <p className="text-sm font-black text-white">{tournament.name}</p>
            <p className="text-xs text-gray-400">{tournament.subtitle}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/7 bg-white/4">
          {[
            {
              label: "Entry Fee",
              value:
                tournament.entryFee === 0
                  ? "Free"
                  : `${tournament.entryFee.toLocaleString()} coins`,
              yellow: false,
            },
            {
              label: "Prize Pool",
              value: `${formatTournamentCompactNumber(tournament.prize)} coins`,
              yellow: true,
            },
            {
              label: "Your Balance",
              value: `${balance.toLocaleString()} coins`,
              yellow: false,
            },
            {
              label: "After Joining",
              value: `${(balance - tournament.entryFee).toLocaleString()} coins`,
              yellow: false,
            },
          ].map(({ label, value, yellow }, i) => (
            <div
              key={label}
              className={`flex justify-between px-4 py-3 ${
                i < 3 ? "border-b border-white/5" : ""
              }`}
            >
              <span className="text-xs text-gray-500">{label}</span>
              <span
                className={`text-xs font-black ${
                  yellow ? "text-yellow-300" : "text-white"
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {!canAfford && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-center text-xs font-semibold text-rose-400">
            Insufficient balance — need{" "}
            {(tournament.entryFee - balance).toLocaleString()} more coins
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/6 py-3 text-sm font-bold text-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canAfford || loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <FiCheck /> Confirm & Join
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
