import type { ReactNode } from "react";
import { FaCoins } from "react-icons/fa";
import { FiCheck, FiExternalLink, FiImage, FiX } from "react-icons/fi";
import { MdPictureAsPdf } from "react-icons/md";
import { getAvatarInitials, getPublicAssetUrl } from "../../../../lib/assets";
import DepositStatusBadge from "./DepositStatusBadge";

type DepositReviewUser = {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string | null;
  role?: string;
};

type DepositReviewItem = {
  id: string;
  userId?: string;
  amount: number;
  method?: string | null;
  status: string;
  proofUrl?: string | null;
  createdAt?: string;
  user?: DepositReviewUser;
};

type DepositReviewCardProps = {
  deposit: DepositReviewItem;
  tone?: "agent" | "admin";
  subtitle?: string;
  details?: ReactNode;
  pendingStatuses?: string[];
  actionLoading?: boolean;
  showTimestamp?: boolean;
  onUserClick?: () => void;
  onShowProof?: (url: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  approveLabel?: string;
  rejectLabel?: string;
};

export default function DepositReviewCard({
  deposit,
  tone = "agent",
  subtitle,
  details,
  pendingStatuses = ["PENDING"],
  actionLoading = false,
  showTimestamp = false,
  onUserClick,
  onShowProof,
  onApprove,
  onReject,
  approveLabel = "Approve",
  rejectLabel = "Reject",
}: DepositReviewCardProps) {
  const isPending = pendingStatuses.includes(deposit.status);
  const proofUrl = getPublicAssetUrl(deposit.proofUrl);
  const avatarUrl = getPublicAssetUrl(deposit.user?.avatar);
  const hasActions = isPending && (onApprove || onReject);
  const isPdf = proofUrl?.toLowerCase().includes(".pdf");

  return (
    <div className="bg-white/4 border border-white/7 rounded-2xl p-4 flex flex-col gap-3">
      <div
        className={`flex items-center gap-3 ${onUserClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
        onClick={onUserClick}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={deposit.user?.username ?? ""}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/8 ring-2 ring-white/10 shrink-0 flex items-center justify-center text-white text-xs font-black">
            {getAvatarInitials(
              deposit.user?.firstName,
              deposit.user?.lastName,
              "?",
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">
            {deposit.user?.firstName} {deposit.user?.lastName}
          </p>
          {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="flex items-center gap-1 text-base font-black text-yellow-300">
            <FaCoins className="text-xs text-yellow-400" />
            {Number(deposit.amount).toLocaleString()}
          </span>
          <DepositStatusBadge status={deposit.status} tone={tone} />
        </div>
      </div>

      {details}

      {proofUrl && onShowProof && (
        <button
          type="button"
          onClick={() => onShowProof(proofUrl)}
          aria-label="View payment proof"
          title="View payment proof"
          className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/15 transition-colors"
        >
          {isPdf ? (
            <MdPictureAsPdf className="text-base shrink-0" />
          ) : tone === "admin" ? (
            <FiImage className="text-sm shrink-0" />
          ) : (
            <FiExternalLink className="text-sm shrink-0" />
          )}
          {tone === "admin" ? "View Payment Proof" : "Show Proof"}
          <FiExternalLink className="text-xs ml-auto" />
        </button>
      )}

      {showTimestamp && deposit.createdAt && (
        <p className="text-[10px] text-gray-600">
          {new Date(deposit.createdAt).toLocaleString()}
        </p>
      )}

      {hasActions && (
        <div className="flex gap-2">
          {onReject && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onReject(deposit.id)}
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
              onClick={() => onApprove(deposit.id)}
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
