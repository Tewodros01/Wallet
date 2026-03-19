import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import {
  FiArrowLeft,
  FiCheck,
  FiExternalLink,
  FiImage,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import {
  useAdminApproveDeposit,
  useAdminDeposits,
  useAdminRejectDeposit,
} from "../hooks/usePayments";
import type { AdminDeposit } from "../types";

const statusStyle: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  FAILED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

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

  const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
          <input
            type="text"
            aria-label="Search deposits"
            placeholder="Search name, username, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1">
          {(["ALL", "PENDING", "COMPLETED", "FAILED"] as StatusFilter[]).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  statusFilter === s
                    ? "bg-emerald-500 text-white"
                    : "text-gray-500"
                }`}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ),
          )}
        </div>

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
            <p className="text-sm font-semibold">No deposits found</p>
          </div>
        ) : (
          filtered.map((item: AdminDeposit) => {
            const isPending = item.status === "PENDING";
            const proofUrl = item.proofUrl
              ? item.proofUrl.startsWith("http")
                ? item.proofUrl
                : `${apiBase}${item.proofUrl}`
              : null;
            return (
              <div
                key={item.id}
                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      if (item.user?.role === "AGENT") {
                        navigate(`/admin/agents/${item.user?.id}`);
                      } else {
                        navigate(`/admin/users/${item.user?.id}`);
                      }
                    }}
                  >
                    <img
                      src={
                        item.user?.avatar ??
                        `https://i.pravatar.cc/40?u=${item.user?.id}`
                      }
                      alt={item.user?.username}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">
                        {item.user?.firstName} {item.user?.lastName}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        @{item.user?.username}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[item.status] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.04] rounded-xl px-3 py-2">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                      Amount
                    </p>
                    <p className="text-sm font-black text-emerald-300 flex items-center gap-1">
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
                  {item.reference && (
                    <div className="bg-white/[0.04] rounded-xl px-3 py-2 col-span-2">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                        Reference
                      </p>
                      <p className="text-sm font-bold text-white">
                        {item.reference}
                      </p>
                    </div>
                  )}
                </div>

                {/* Proof */}
                {proofUrl && (
                  <button
                    type="button"
                    onClick={() => setProofModal(proofUrl)}
                    aria-label="View payment proof"
                    title="View payment proof"
                    className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-xs text-blue-400 font-bold hover:bg-blue-500/15 transition-colors"
                  >
                    <FiImage className="text-sm" />
                    View Payment Proof
                    <FiExternalLink className="text-xs ml-auto" />
                  </button>
                )}

                <p className="text-[10px] text-gray-600">
                  {new Date(item.createdAt).toLocaleString()}
                </p>

                {isPending && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actionLoading === item.id}
                      onClick={() =>
                        handleAction((id, o) => rejectDeposit(id, o), item.id)
                      }
                      className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all"
                    >
                      {actionLoading === item.id ? (
                        <span className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiX /> Reject
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === item.id}
                      onClick={() =>
                        handleAction((id, o) => approveDeposit(id, o), item.id)
                      }
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all"
                    >
                      {actionLoading === item.id ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiCheck /> Approve
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Proof image modal */}
      {proofModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 flex flex-col items-center justify-center p-5 gap-4"
          onClick={() => setProofModal(null)}
        >
          <div
            className="w-full max-w-sm flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-white">Payment Proof</p>
              <button
                type="button"
                onClick={() => setProofModal(null)}
                aria-label="Close modal"
                title="Close modal"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <FiX className="text-white text-sm" />
              </button>
            </div>
            {proofModal.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
            proofModal.includes("/proofs/") ? (
              <img
                src={proofModal}
                alt="Payment proof"
                className="w-full rounded-2xl object-contain max-h-[70vh] bg-white/5"
              />
            ) : (
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 flex flex-col items-center gap-3">
                <FiImage className="text-4xl text-gray-500" />
                <p className="text-xs text-gray-400 text-center break-all">
                  {proofModal}
                </p>
              </div>
            )}
            <a
              href={proofModal}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500/15 border border-blue-500/25 text-blue-400 text-sm font-bold"
            >
              <FiExternalLink /> Open in browser
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
