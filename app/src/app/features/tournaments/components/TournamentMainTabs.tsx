type MainTab = "tournaments" | "leaderboard";

type TournamentMainTabsProps = {
  value: MainTab;
  onChange: (value: MainTab) => void;
};

export default function TournamentMainTabs({
  value,
  onChange,
}: TournamentMainTabsProps) {
  return (
    <div className="flex gap-1.5 rounded-2xl border border-white/7 bg-white/4 p-1">
      {(["tournaments", "leaderboard"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`flex-1 rounded-xl py-1.5 text-[10px] font-bold capitalize transition-all ${
            value === tab ? "bg-emerald-500 text-white" : "text-gray-500"
          }`}
        >
          {tab === "tournaments" ? "Tournaments" : "🏆 Leaderboard"}
        </button>
      ))}
    </div>
  );
}
