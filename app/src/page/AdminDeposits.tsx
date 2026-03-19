import { useState } from "react";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";
import { FaCoins } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import {
  useAdminDeposits,
  useAdminApproveDeposit,
  useAdminRejectDeposit,
} from "../hooks/usePayments";

const statusStyle: Record<string, string> = {
  PENDING:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  APPROVED:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  REJECTED:  "bg-rose-500/15 text-rose-400 border-rose-500/30",
  FAILED:    "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function AdminDeposits() {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: deposits = [], isLoading } = useAdminDeposits();
  const { mutate: approveDeposit } = useAdminApproveDeposit();
  const { mutate: rejectDeposit }  = useAdminRejectDeposit();

  const pending = deposits.filter((d: any) => d.status === "PENDING");

  const handleAction = (fn: (id: string, opts: any) => void, id: string) => {
    setActionLoading(id);
    fn(id, { onSettled: () => setActionLoading(null) });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <span className="text-base font-black">Deposits</span>
              <p className="text-[10px] text-gray-500">{deposits.length} total · {pending.length} pending</p>
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-3 px-5 py-4 pb-10">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {deposits.length} Deposit{deposits.length !== 1 ? "s" : ""}
          </p>
          {pending.length > 0 && (
            <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
              {pending.length} pending
            </span>
          )}
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-36 bg-white/[0.04] rounded-2xl animate-pulse" />)
        ) : deposits.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-600">
            <FaCoins className="text-3xl" />
            <p className="text-sm font-semibold">No deposit requests</p>
          </div>
        ) : (
          deposits.map((item: any) => {
            const isPending = item.status === "PENDING";
            return (
              <div key={item.id} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.user?.avatar ?? `https://i.pravatar.cc/40?u=${item.user?.id}`}
                      alt={item.user?.username}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{item.user?.firstName} {item.user?.lastName}</p>
                      <p className="text-[11px] text-gray-500">@{item.user?.username}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[item.status] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.04] rounded-xl px-3 py-2">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wide">Amount</p>
                    <p className="text-sm font-black text-emerald-300 flex items-center gap-1">
                      <FaCoins className="text-yellow-400 text-xs" />
                      {Number(item.amount).toLocaleString()} coins
                    </p>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl px-3 py-2">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wide">Method</p>
                    <p className="text-sm font-bold text-white">{item.method ?? "—"}</p>
                  </div>
                  {item.reference && (
                    <div className="bg-white/[0.04] rounded-xl px-3 py-2 col-span-2">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wide">Reference</p>
                      <p className="text-sm font-bold text-white">{item.reference}</p>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-gray-600">{new Date(item.createdAt).toLocaleString()}</p>

                {isPending && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actionLoading === item.id}
                      onClick={() => handleAction((id, o) => rejectDeposit(id, o), item.id)}
                      className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all"
                    >
                      {actionLoading === item.id ? <span className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" /> : <><FiX /> Reject</>}
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === item.id}
                      onClick={() => handleAction((id, o) => approveDeposit(id, o), item.id)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all"
                    >
                      {actionLoading === item.id ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiCheck /> Approve</>}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
