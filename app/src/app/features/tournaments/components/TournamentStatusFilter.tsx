type Filter = "all" | "UPCOMING" | "LIVE" | "FINISHED";

type TournamentStatusFilterProps = {
  value: Filter;
  onChange: (value: Filter) => void;
};

export default function TournamentStatusFilter({
  value,
  onChange,
}: TournamentStatusFilterProps) {
  return (
    <div className="flex gap-1.5 rounded-2xl border border-white/7 bg-white/4 p-1">
      {(["all", "LIVE", "UPCOMING", "FINISHED"] as const).map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter)}
          className={`flex-1 rounded-xl py-1.5 text-[10px] font-bold capitalize transition-all ${
            value === filter ? "bg-violet-500 text-white" : "text-gray-500"
          }`}
        >
          {filter === "all"
            ? "All"
            : filter.charAt(0) + filter.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );
}
