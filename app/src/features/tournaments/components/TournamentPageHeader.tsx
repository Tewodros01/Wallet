import { FaTrophy } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import TournamentMainTabs from "./TournamentMainTabs";
import TournamentStatusFilter from "./TournamentStatusFilter";

type Filter = "all" | "UPCOMING" | "LIVE" | "FINISHED";
type MainTab = "tournaments" | "leaderboard";

type TournamentPageHeaderProps = {
  liveCount: number;
  upcomingCount: number;
  mainTab: MainTab;
  filter: Filter;
  onBack: () => void;
  onMainTabChange: (value: MainTab) => void;
  onFilterChange: (value: Filter) => void;
};

export default function TournamentPageHeader({
  liveCount,
  upcomingCount,
  mainTab,
  filter,
  onBack,
  onMainTabChange,
  onFilterChange,
}: TournamentPageHeaderProps) {
  return (
    <div className="sticky top-0 z-40 flex flex-col gap-3 border-b border-white/6 bg-gray-950/95 px-5 pb-3 pt-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            title="Go back"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 bg-white/6"
          >
            <FiArrowLeft className="text-sm text-white" />
          </button>
          <div>
            <p className="text-base font-black text-white">Tournaments</p>
            <p className="text-[10px] text-gray-500">
              {liveCount} live · {upcomingCount} upcoming
            </p>
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10">
          <FaTrophy className="text-sm text-yellow-400" />
        </div>
      </div>

      <TournamentMainTabs value={mainTab} onChange={onMainTabChange} />

      {mainTab === "tournaments" && (
        <TournamentStatusFilter value={filter} onChange={onFilterChange} />
      )}
    </div>
  );
}
