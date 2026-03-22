import { FaCoins } from "react-icons/fa";
import { FiArrowLeft, FiArrowUp, FiCheck, FiClock, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import { useWithdrawals } from "../hooks/usePayments";
import type { Withdrawal } from "../types/payment.types";

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    icon: <FiClock />,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  PROCESSING: {
    label: "Processing",
    icon: <FiArrowUp />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  COMPLETED: {
    label: "Completed",
    icon: <FiCheck />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  FAILED: {
    label: "Failed",
    icon: <FiX />,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  REJECTED: {
    label: "Rejected",
    icon: <FiX />,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
} as const;

const METHOD_LABEL: Record<string, string> = {
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE Birr",
  BANK_CARD: "Bank Card",
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WithdrawalStatus() {
  const navigate = useNavigate();
  const { data: withdrawals = [], isLoading } = useWithdrawals();

  const pending = withdrawals.filter(
    (w: Withdrawal) => w.status === "PENDING" || w.status === "PROCESSING",
  ).length;
  const totalCoins = withdrawals
    .filter((w: Withdrawal) => w.status === "COMPLETED")
    .reduce((s: number, w: Withdrawal) => s + Number(w.amount), 0);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              title="Go back"
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black text-white leading-tight">
                Withdrawals
              </p>
              <p className="text-[10px] text-gray-500">
                {withdrawals.length} total · {pending} pending
              </p>
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-4 px-5 py-4 pb-12">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total", value: withdrawals.length, color: "text-white" },
            { label: "Pending", value: pending, color: "text-orange-400" },
            {
              label: "Paid Out",
              value: `${totalCoins.toLocaleString()} 🪙`,
              color: "text-emerald-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white/4 border border-white/7 rounded-2xl py-3 flex flex-col items-center gap-0.5"
            >
              <span className={`text-sm font-black ${color}`}>{value}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-white/4 rounded-2xl animate-pulse"
            />
          ))
        ) : withdrawals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-600">
            <FiArrowUp className="text-3xl" />
            <p className="text-sm font-semibold">No withdrawals yet</p>
            <button
              type="button"
              onClick={() => navigate("/get-money")}
              className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold"
            >
              Withdraw Now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {withdrawals.map((w: Withdrawal) => {
              const cfg =
                STATUS_CONFIG[w.status as keyof typeof STATUS_CONFIG] ??
                STATUS_CONFIG.PENDING;
              return (
                <div
                  key={w.id}
                  className="bg-white/4 border border-white/7 rounded-2xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaCoins className="text-yellow-400 text-sm" />
                      <span className="text-base font-black text-yellow-300">
                        {Number(w.amount).toLocaleString()} coins
                      </span>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Method</p>
                      <p className="text-white font-semibold">
                        {METHOD_LABEL[w.method] ?? w.method}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Account</p>
                      <p className="text-white font-semibold truncate">
                        {w.accountNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Requested</p>
                      <p className="text-white font-semibold">
                        {fmt(w.createdAt)}
                      </p>
                    </div>
                    {w.completedAt && (
                      <div>
                        <p className="text-gray-500">Completed</p>
                        <p className="text-emerald-400 font-semibold">
                          {fmt(w.completedAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {w.failureReason && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 text-xs text-rose-400">
                      {w.failureReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
