import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import ReviewSearchBar from "../features/payments/components/ReviewSearchBar";
import StatusSegmentedFilter from "../features/payments/components/StatusSegmentedFilter";
import WithdrawalReviewCard from "../features/payments/components/WithdrawalReviewCard";
import {
  useAdminApproveWithdrawal,
  useAdminRejectWithdrawal,
  useAdminWithdrawals,
} from "../hooks/usePayments";
import type { AdminWithdrawal } from "../types";

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED";

export default function AdminWithdrawals() {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { data: withdrawals = [], isLoading } = useAdminWithdrawals();
  const { mutate: approveWithdrawal } = useAdminApproveWithdrawal();
  const { mutate: rejectWithdrawal } = useAdminRejectWithdrawal();

  const pending = withdrawals.filter(
    (w: AdminWithdrawal) => w.status === "PENDING" || w.status === "PROCESSING",
  );

  const filtered = withdrawals.filter((w: AdminWithdrawal) => {
    const matchStatus = statusFilter === "ALL" || w.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${w.user?.firstName} ${w.user?.lastName}`.toLowerCase().includes(q) ||
      (w.user?.username ?? "").toLowerCase().includes(q) ||
      (w.accountNumber ?? "").toLowerCase().includes(q) ||
      String(w.amount).includes(q);
    return matchStatus && matchSearch;
  });

  const handleAction = (
    fn: (id: string, opts: { onSettled: () => void }) => void,
    id: string,
  ) => {
    setActionLoading(id);
    fn(id, { onSettled: () => setActionLoading(null) });
  };

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
              <span className="text-base font-black">Withdrawals</span>
              <p className="text-[10px] text-gray-500">
                {withdrawals.length} total · {pending.length} pending
              </p>
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-3 px-5 py-4 pb-10">
        <ReviewSearchBar
          value={search}
          onChange={setSearch}
          ariaLabel="Search withdrawals"
          placeholder="Search name, username, account..."
        />

        <StatusSegmentedFilter
          value={statusFilter}
          options={
            [
              "ALL",
              "PENDING",
              "PROCESSING",
              "COMPLETED",
              "FAILED",
              "REJECTED",
            ] as const
          }
          onChange={setStatusFilter}
          compact
        />

        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>

        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-white/[0.04] rounded-2xl animate-pulse"
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-600">
            <FaCoins className="text-3xl" />
            <p className="text-sm font-semibold">No withdrawals found</p>
          </div>
        ) : (
          filtered.map((item: AdminWithdrawal) => {
            return (
              <WithdrawalReviewCard
                key={item.id}
                withdrawal={item}
                tone="admin"
                subtitle={`@${item.user?.username ?? "unknown"}`}
                details={
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.04] rounded-xl px-3 py-2">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                        Amount
                      </p>
                      <p className="text-sm font-black text-rose-300 flex items-center gap-1">
                        <FaCoins className="text-yellow-400 text-xs" />
                        {Number(item.amount).toLocaleString()} coins
                      </p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl px-3 py-2">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                        Method
                      </p>
                      <p className="text-sm font-bold text-white">
                        {item.method ?? "—"}
                      </p>
                    </div>
                    {item.accountNumber && (
                      <div className="bg-white/[0.04] rounded-xl px-3 py-2 col-span-2">
                        <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                          Account
                        </p>
                        <p className="text-sm font-bold text-white font-mono">
                          {item.accountNumber}
                        </p>
                      </div>
                    )}
                  </div>
                }
                actionLoading={actionLoading === item.id}
                showTimestamp
                onUserClick={() => {
                  if (item.user?.role === "AGENT") {
                    navigate(`/admin/agents/${item.user?.id}`);
                    return;
                  }

                  navigate(`/admin/users/${item.user?.id}`);
                }}
                onReject={(id) =>
                  handleAction(
                    (withdrawalId, opts) => rejectWithdrawal(withdrawalId, opts),
                    id,
                  )
                }
                onApprove={(id) =>
                  handleAction(
                    (withdrawalId, opts) => approveWithdrawal(withdrawalId, opts),
                    id,
                  )
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
}
