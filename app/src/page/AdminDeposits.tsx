import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ProofViewerSheet from "../components/payment/ProofViewerSheet";
import { AppBar } from "../components/ui/Layout";
import DepositReviewCard from "../features/payments/components/DepositReviewCard";
import ReviewSearchBar from "../features/payments/components/ReviewSearchBar";
import StatusSegmentedFilter from "../features/payments/components/StatusSegmentedFilter";
import {
  useAdminApproveDeposit,
  useAdminDeposits,
  useAdminRejectDeposit,
} from "../hooks/usePayments";
import type { AdminDeposit } from "../types";

type StatusFilter = "ALL" | "PENDING" | "COMPLETED" | "FAILED";

export default function AdminDeposits() {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [proofModal, setProofModal] = useState<string | null>(null);

  const { data: deposits = [], isLoading } = useAdminDeposits();
  const { mutate: approveDeposit } = useAdminApproveDeposit();
  const { mutate: rejectDeposit } = useAdminRejectDeposit();

  const pending = deposits.filter((d: AdminDeposit) => d.status === "PENDING");

  const filtered = deposits.filter((d: AdminDeposit) => {
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${d.user?.firstName} ${d.user?.lastName}`.toLowerCase().includes(q) ||
      (d.user?.username ?? "").toLowerCase().includes(q) ||
      (d.reference ?? "").toLowerCase().includes(q) ||
      String(d.amount).includes(q);
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
              title="Go back"
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <span className="text-base font-black">Deposits</span>
              <p className="text-[10px] text-gray-500">
                {deposits.length} total · {pending.length} pending
              </p>
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-3 px-5 py-4 pb-10">
        <ReviewSearchBar
          value={search}
          onChange={setSearch}
          ariaLabel="Search deposits"
          placeholder="Search name, username, reference..."
        />

        <StatusSegmentedFilter
          value={statusFilter}
          options={["ALL", "PENDING", "COMPLETED", "FAILED"] as const}
          onChange={setStatusFilter}
        />

        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>

        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-white/4 rounded-2xl animate-pulse"
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-600">
            <FaCoins className="text-3xl" />
            <p className="text-sm font-semibold">No deposits found</p>
          </div>
        ) : (
          filtered.map((item: AdminDeposit) => {
            return (
              <DepositReviewCard
                key={item.id}
                deposit={item}
                tone="admin"
                subtitle={`@${item.user?.username ?? "unknown"}`}
                details={
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/4 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                        Amount
                      </p>
                      <p className="text-sm font-black text-emerald-300 flex items-center gap-1">
                        <FaCoins className="text-yellow-400 text-xs" />
                        {Number(item.amount).toLocaleString()} coins
                      </p>
                    </div>
                    <div className="bg-white/4 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                        Method
                      </p>
                      <p className="text-sm font-bold text-white">
                        {item.method ?? "—"}
                      </p>
                    </div>
                    {item.reference && (
                      <div className="bg-white/4 rounded-xl px-3 py-2 col-span-2">
                        <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                          Reference
                        </p>
                        <p className="text-sm font-bold text-white">
                          {item.reference}
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
                onShowProof={(url) => setProofModal(url)}
                onReject={(id) =>
                  handleAction((depositId, opts) => rejectDeposit(depositId, opts), id)
                }
                onApprove={(id) =>
                  handleAction((depositId, opts) => approveDeposit(depositId, opts), id)
                }
              />
            );
          })
        )}
      </div>

      <ProofViewerSheet
        open={!!proofModal}
        url={proofModal}
        onClose={() => setProofModal(null)}
      />
    </div>
  );
}
