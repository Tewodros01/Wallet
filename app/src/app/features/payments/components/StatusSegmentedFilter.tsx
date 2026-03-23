type StatusSegmentedFilterProps<T extends string> = {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  compact?: boolean;
};

export default function StatusSegmentedFilter<T extends string>({
  value,
  options,
  onChange,
  compact = false,
}: StatusSegmentedFilterProps<T>) {
  return (
    <div
      className={`flex bg-white/4 border border-white/7 rounded-2xl p-1 ${
        compact ? "gap-1 overflow-x-auto" : "gap-1.5"
      }`}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`${
            compact ? "flex-shrink-0 px-3" : "flex-1"
          } py-1.5 rounded-xl text-[10px] font-bold transition-all ${
            value === option ? "bg-emerald-500 text-white" : "text-gray-500"
          }`}
        >
          {option === "ALL"
            ? "All"
            : option.charAt(0) + option.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );
}
