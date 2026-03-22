import { FiSearch } from "react-icons/fi";

type Filter = "all" | "waiting" | "playing";

type BingoLobbyFiltersProps = {
  search: string;
  filter: Filter;
  total: number;
  waiting: number;
  playing: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: Filter) => void;
  onFilterTap?: () => void;
};

export default function BingoLobbyFilters({
  search,
  filter,
  total,
  waiting,
  playing,
  onSearchChange,
  onFilterChange,
  onFilterTap,
}: BingoLobbyFiltersProps) {
  return (
    <>
      <div className="flex items-center gap-3 bg-white/6 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-500 transition-all">
        <FiSearch className="text-gray-500 shrink-0" />
        <input
          type="text"
          aria-label="Search rooms"
          placeholder="Search rooms, hosts..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
        />
      </div>

      <div className="flex gap-2">
        {(["all", "waiting", "playing"] as Filter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              onFilterChange(value);
              onFilterTap?.();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === value
                ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {value === "all"
              ? `All (${total})`
              : value === "waiting"
                ? `Waiting (${waiting})`
                : `Playing (${playing})`}
          </button>
        ))}
      </div>
    </>
  );
}
