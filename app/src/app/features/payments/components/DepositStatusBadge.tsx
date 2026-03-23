type DepositStatusBadgeProps = {
  status: string;
  tone?: "agent" | "admin";
};

const agentStyles: Record<string, string> = {
  PENDING: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  FAILED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  PROCESSING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const adminStyles: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  FAILED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  PROCESSING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export default function DepositStatusBadge({
  status,
  tone = "agent",
}: DepositStatusBadgeProps) {
  const styles = tone === "admin" ? adminStyles : agentStyles;

  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
        styles[status] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30"
      }`}
    >
      {status}
    </span>
  );
}
