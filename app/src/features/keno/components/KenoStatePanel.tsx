type KenoStatePanelProps = {
  mode: "loading" | "empty";
  title?: string;
  subtitle?: string;
  count?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export default function KenoStatePanel({
  mode,
  title,
  subtitle,
  count = 4,
  action,
}: KenoStatePanelProps) {
  if (mode === "loading") {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl bg-white/[0.04]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-gray-600">
      <div className="text-4xl">🎰</div>
      <p className="text-sm font-semibold">{title}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-xs font-bold text-cyan-400 transition-colors hover:text-cyan-300"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
