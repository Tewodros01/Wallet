type BingoStatePanelProps = {
  mode: "loading" | "empty";
  title?: string;
  subtitle?: string;
  count?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export default function BingoStatePanel({
  mode,
  title,
  subtitle,
  count = 3,
  action,
}: BingoStatePanelProps) {
  if (mode === "loading") {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-3xl border border-white/7 bg-white/4"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/7 bg-white/3 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-2xl">
        🎱
      </div>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-white"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
