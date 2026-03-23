import { FaTrophy } from "react-icons/fa";

type TournamentStatePanelProps = {
  mode: "loading" | "empty";
  title?: string;
  count?: number;
  cardHeightClassName?: string;
};

export default function TournamentStatePanel({
  mode,
  title,
  count = 3,
  cardHeightClassName = "h-64",
}: TournamentStatePanelProps) {
  if (mode === "loading") {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={`${cardHeightClassName} animate-pulse rounded-3xl bg-white/4`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-20 text-gray-600">
      <FaTrophy className="text-3xl" />
      <p className="text-sm font-semibold">{title}</p>
    </div>
  );
}
