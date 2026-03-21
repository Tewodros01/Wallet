import { FaCoins } from "react-icons/fa";
import { FiArrowLeft, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import KenoStatePanel from "../features/keno/components/KenoStatePanel";
import { useKenoRoundHistory } from "../features/keno/hooks";
import { formatKenoHistoryDate } from "../features/keno/utils";

export default function KenoHistory() {
  const navigate = useNavigate();
  const { data: history = [], isLoading } = useKenoRoundHistory();

  const wins = history.filter((h) => h.type === "GAME_WIN");
  const losses = history.filter((h) => h.type === "GAME_ENTRY");
  const totalWon = wins.reduce((s, h) => s + Number(h.amount), 0);
  const totalLost = losses.reduce((s, h) => s + Number(h.amount), 0);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black">Keno History</p>
              <p className="text-[10px] text-gray-500">
                {history.length} rounds played
              </p>
            </div>
          </div>
        }
        right={
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <GiCoins className="text-cyan-400 text-sm" />
          </div>
        }
      />

      <div className="flex flex-col gap-4 px-5 py-4 pb-10">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
              <FiTrendingUp className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                Total Won
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <FaCoins className="text-yellow-400 text-xs" />
                <span className="text-base font-black text-emerald-400">
                  {totalWon.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
              <FiTrendingDown className="text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                Total Bet
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <FaCoins className="text-yellow-400 text-xs" />
                <span className="text-base font-black text-rose-400">
                  {totalLost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Rounds", value: history.length, color: "text-white" },
            { label: "Wins", value: wins.length, color: "text-emerald-400" },
            {
              label: "Win Rate",
              value: history.length
                ? `${Math.round((wins.length / history.length) * 100)}%`
                : "—",
              color: "text-cyan-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3 flex flex-col items-center gap-1"
            >
              <span className={`text-base font-black leading-none ${color}`}>
                {value}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {history.length} round{history.length !== 1 ? "s" : ""}
        </p>

        {isLoading ? (
          <KenoStatePanel mode="loading" />
        ) : history.length === 0 ? (
          <KenoStatePanel
            mode="empty"
            title="No Keno rounds yet"
            action={{
              label: "Play Keno ->",
              onClick: () => navigate("/keno"),
            }}
          />
        ) : (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
            {history.map((h, i) => {
              const isWin = h.type === "GAME_WIN";
              return (
                <div
                  key={h.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i < history.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${isWin ? "bg-emerald-500/15" : "bg-rose-500/10"}`}
                  >
                    {isWin ? "🏆" : "🎰"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {h.title}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {formatKenoHistoryDate(h.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <FaCoins className="text-yellow-400 text-[10px]" />
                    <span
                      className={`text-sm font-black ${isWin ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {isWin ? "+" : "-"}
                      {Number(h.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
