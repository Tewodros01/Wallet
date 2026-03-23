import type { ReactNode } from "react";
import { FaCoins } from "react-icons/fa";
import { FiCheck, FiX } from "react-icons/fi";
import { getAvatarInitials, getPublicAssetUrl } from "../../../../lib/assets";
import DepositStatusBadge from "./DepositStatusBadge";

type WithdrawalReviewUser = {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string | null;
  role?: string;
};

type WithdrawalReviewItem = {
  id: string;
  status: string;
  amount: number;
  method?: string | null;
  accountNumber?: string | null;
  createdAt?: string;
  user?: WithdrawalReviewUser;
};

type WithdrawalReviewCardProps = {
  withdrawal: WithdrawalReviewItem;
  tone?: "agent" | "admin";
  subtitle?: string;
  details?: ReactNode;
  pendingStatuses?: string[];
  actionLoading?: boolean;
  showTimestamp?: boolean;
  onUserClick?: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  approveLabel?: string;
  rejectLabel?: string;
};

export default function WithdrawalReviewCard({
  withdrawal,
  tone = "admin",
  subtitle,
  details,
  pendingStatuses = ["PENDING", "PROCESSING"],
  actionLoading = false,
  showTimestamp = false,
  onUserClick,
  onApprove,
  onReject,
  approveLabel = "Approve",
  rejectLabel = "Reject",
}: WithdrawalReviewCardProps) {
  const isPending = pendingStatuses.includes(withdrawal.status);
  const avatarUrl = getPublicAssetUrl(withdrawal.user?.avatar);
  const hasActions = isPending && (onApprove || onReject);

  return (
    <div className="bg-white/4 border border-white/7 rounded-2xl p-4 flex flex-col gap-3">
      <div
        className={`flex items-center gap-3 ${onUserClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
        onClick={onUserClick}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={withdrawal.user?.username ?? ""}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/8 ring-2 ring-white/10 shrink-0 flex items-center justify-center text-white text-xs font-black">
            {getAvatarInitials(
              withdrawal.user?.firstName,
              withdrawal.user?.lastName,
              "?",
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">
            {withdrawal.user?.firstName} {withdrawal.user?.lastName}
          </p>
          {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="flex items-center gap-1 text-base font-black text-yellow-300">
            <FaCoins className="text-xs text-yellow-400" />
            {Number(withdrawal.amount).toLocaleString()}
          </span>
          <DepositStatusBadge status={withdrawal.status} tone={tone} />
        </div>
      </div>

      {details}

      {showTimestamp && withdrawal.createdAt && (
        <p className="text-[10px] text-gray-600">
          {new Date(withdrawal.createdAt).toLocaleString()}
        </p>
      )}

      {hasActions && (
        <div className="flex gap-2">
          {onReject && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onReject(withdrawal.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all ${
                tone === "admin"
                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
              }`}
            >
              {actionLoading ? (
                <span
                  className={`w-4 h-4 border-2 rounded-full animate-spin ${
                    tone === "admin"
                      ? "border-rose-400/30 border-t-rose-400"
                      : "border-rose-400/30 border-t-rose-400"
                  }`}
                />
              ) : (
                <>
                  <FiX /> {rejectLabel}
                </>
              )}
            </button>
          )}
          {onApprove && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onApprove(withdrawal.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all ${
                tone === "admin"
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
              }`}
            >
              {actionLoading ? (
                <span
                  className={`w-4 h-4 border-2 rounded-full animate-spin ${
                    tone === "admin"
                      ? "border-white/30 border-t-white"
                      : "border-emerald-400/30 border-t-emerald-400"
                  }`}
                />
              ) : (
                <>
                  <FiCheck /> {approveLabel}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
