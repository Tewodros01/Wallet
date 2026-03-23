import { FiSearch, FiX } from "react-icons/fi";

type ReviewSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
};

export default function ReviewSearchBar({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: ReviewSearchBarProps) {
  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
      <input
        type="text"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/4 border border-white/7 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          title="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        >
          <FiX className="text-sm" />
        </button>
      )}
    </div>
  );
}
