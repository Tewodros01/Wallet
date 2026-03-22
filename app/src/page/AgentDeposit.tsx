import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import { FiArrowLeft, FiTrendingUp } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../api/users.api";
import ProofViewerSheet from "../components/payment/ProofViewerSheet";
import EmptyState from "../components/ui/EmptyState";
import { AppBar } from "../components/ui/Layout";
import AgentAccountsSection from "../features/agents/components/AgentAccountsSection";
import {
  AgentPanelTabs,
  AgentSummaryStats,
} from "../features/agents/components/AgentPanelOverview";
import { AGENT_TABS, type AgentTab } from "../features/agents/constants";
import DepositReviewCard from "../features/payments/components/DepositReviewCard";
import StatusSegmentedFilter from "../features/payments/components/StatusSegmentedFilter";
import WithdrawalReviewCard from "../features/payments/components/WithdrawalReviewCard";
import { paymentKeys } from "../features/payments/queryKeys";
import { useAgentStats } from "../hooks/useAgents";
import {
  useAgentApproveDeposit,
  useAgentApproveWithdrawal,
  useAgentRejectDeposit,
  useAgentRejectWithdrawal,
  useAgentRequests,
} from "../hooks/usePayments";
import { useMe, userKeys } from "../hooks/useUser";
import { getErrorMessage } from "../lib/errors";
import type {
  AgentDepositRequest,
  AgentWithdrawalRequest,
} from "../types/agent-requests.types";
import { FinancialAccountProvider } from "../types/enums";
import type { FinancialAccount } from "../types/financial-account.types";

const DEPOSIT_FILTERS = ["all", "pending", "completed", "failed"] as const;
const WITHDRAWAL_FILTERS = [
  "all",
  "pending",
  "completed",
  "failed",
  "rejected",
] as const;
type DepositFilter = (typeof DEPOSIT_FILTERS)[number];
type WithdrawalFilter = (typeof WITHDRAWAL_FILTERS)[number];

export default function AgentDeposit() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<AgentTab>("deposits");
  const [dFilter, setDFilter] = useState<DepositFilter>("all");
  const [wFilter, setWFilter] = useState<WithdrawalFilter>("all");
  const [proofSheet, setProofSheet] = useState<{
    url: string;
  } | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [provider, setProvider] = useState<FinancialAccountProvider>(
    FinancialAccountProvider.TELEBIRR,
  );
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [label, setLabel] = useState("");
  const [isDefaultAccount, setIsDefaultAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [removingAccountId, setRemovingAccountId] = useState<string | null>(
    null,
  );

  const { data: requests, isLoading } = useAgentRequests();
  const { data: agentStats } = useAgentStats();
  const { data: me } = useMe();

  const { mutate: approveDeposit, isPending: approvingD } =
    useAgentApproveDeposit();
  const { mutate: rejectDeposit, isPending: rejectingD } =
    useAgentRejectDeposit();
  const { mutate: approveWithdrawal, isPending: approvingW } =
    useAgentApproveWithdrawal();
  const { mutate: rejectWithdrawal, isPending: rejectingW } =
    useAgentRejectWithdrawal();

  const deposits = requests?.deposits ?? [];
  const withdrawals = requests?.withdrawals ?? [];
  const financialAccounts = me?.financialAccounts ?? [];

  const pendingD = deposits.filter(
    (d: AgentDepositRequest) => d.status === "PENDING",
  ).length;
  const pendingW = withdrawals.filter(
    (w: AgentWithdrawalRequest) =>
      w.status === "PENDING" || w.status === "PROCESSING",
  ).length;
  const totalPending = pendingD + pendingW;
  const summaryStats = [
    {
      label: "Pending",
      value: totalPending,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
    },
    {
      label: "Deposits",
      value: deposits.length,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Withdraw",
      value: withdrawals.length,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      label: "Earned",
      value: agentStats?.commission ?? 0,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
  ];

  const filteredD =
    dFilter === "all"
      ? deposits
      : deposits.filter(
          (d: AgentDepositRequest) => d.status === dFilter.toUpperCase(),
        );
  const filteredW =
    wFilter === "all"
      ? withdrawals
      : withdrawals.filter(
          (w: AgentWithdrawalRequest) => w.status === wFilter.toUpperCase(),
        );

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setProvider(FinancialAccountProvider.TELEBIRR);
    setAccountNumber("");
    setAccountName("");
    setLabel("");
    setIsDefaultAccount(financialAccounts.length === 0);
    setAccountError(null);
  };

  const startEditAccount = (account: FinancialAccount) => {
    setEditingAccountId(account.id);
    setProvider(account.provider);
    setAccountNumber(account.accountNumber);
    setAccountName(account.accountName ?? "");
    setLabel(account.label ?? "");
    setIsDefaultAccount(account.isDefault);
    setAccountError(null);
    setTab("accounts");
  };

  const refreshFinancialAccountViews = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: userKeys.me }),
      qc.invalidateQueries({ queryKey: paymentKeys.agents() }),
      qc.invalidateQueries({ queryKey: ["agents", "stats"] }),
    ]);
  };

  const handleSaveAccount = async () => {
    if (!accountNumber.trim()) {
      setAccountError("Account number is required.");
      return;
    }

    setSavingAccount(true);
    setAccountError(null);

    try {
      if (editingAccountId) {
        await usersApi.updateFinancialAccount(editingAccountId, {
          provider,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim() || undefined,
          label: label.trim() || undefined,
          isDefault: isDefaultAccount,
        });
      } else {
        await usersApi.createFinancialAccount({
          provider,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim() || undefined,
          label: label.trim() || undefined,
          isDefault: isDefaultAccount,
        });
      }

      await refreshFinancialAccountViews();
      resetAccountForm();
    } catch (err) {
      setAccountError(getErrorMessage(err, "Failed to save financial account"));
    } finally {
      setSavingAccount(false);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    setRemovingAccountId(accountId);
    setAccountError(null);
    try {
      await usersApi.removeFinancialAccount(accountId);
      await refreshFinancialAccountViews();
      if (editingAccountId === accountId) {
        resetAccountForm();
      }
    } catch (err) {
      setAccountError(
        getErrorMessage(err, "Failed to remove financial account"),
      );
    } finally {
      setRemovingAccountId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <span className="text-base font-black">Agent Panel</span>
          </div>
        }
        right={
          totalPending > 0 ? (
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-black text-white">
                {totalPending}
              </span>
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-10">
        <AgentSummaryStats stats={summaryStats} />
        <AgentPanelTabs tabs={AGENT_TABS} activeTab={tab} onChange={setTab} />

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/[0.04] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Deposits tab */}
            {tab === "deposits" && (
              <div className="flex flex-col gap-4">
                <StatusSegmentedFilter
                  value={dFilter}
                  options={DEPOSIT_FILTERS}
                  onChange={setDFilter}
                />
                <div className="flex flex-col gap-2.5">
                  {filteredD.length === 0 ? (
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04]">
                      <EmptyState
                        type="transactions"
                        title={`No ${dFilter} deposits`}
                      />
                    </div>
                  ) : (
                    filteredD.map((req: AgentDepositRequest) => {
                      return (
                        <DepositReviewCard
                          key={req.id}
                          deposit={req}
                          subtitle={`@${req.user?.username ?? "unknown"} · ${req.method}`}
                          actionLoading={approvingD || rejectingD}
                          onShowProof={(url) =>
                            setProofSheet({
                              url,
                            })
                          }
                          onReject={(id) => rejectDeposit(id)}
                          onApprove={(id) => approveDeposit(id)}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Withdrawals tab */}
            {tab === "withdrawals" && (
              <div className="flex flex-col gap-4">
                <StatusSegmentedFilter
                  value={wFilter}
                  options={WITHDRAWAL_FILTERS}
                  onChange={setWFilter}
                  compact
                />
                <div className="flex flex-col gap-2.5">
                  {filteredW.length === 0 ? (
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04]">
                      <EmptyState
                        type="transactions"
                        title={`No ${wFilter} withdrawals`}
                      />
                    </div>
                  ) : (
                    filteredW.map((req: AgentWithdrawalRequest) => (
                      <WithdrawalReviewCard
                        key={req.id}
                        tone="agent"
                        withdrawal={req}
                        subtitle={`${req.method} · ${req.accountNumber}`}
                        details={
                          (req.status === "PENDING" ||
                            req.status === "PROCESSING") && (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 text-xs text-orange-300">
                              Send{" "}
                              <span className="font-black">
                                {req.amount.toLocaleString()} coins
                              </span>{" "}
                              worth of cash to{" "}
                              <span className="font-black">
                                {req.user?.firstName}
                              </span>{" "}
                              via{" "}
                              <span className="font-black">{req.method}</span> (
                              {req.accountNumber}), then approve.
                            </div>
                          )
                        }
                        actionLoading={approvingW || rejectingW}
                        onReject={(id) => rejectWithdrawal(id)}
                        onApprove={(id) => approveWithdrawal(id)}
                        approveLabel="Cash Sent & Approve"
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Users tab — from invite system */}
            {tab === "users" && (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04]">
                <EmptyState
                  type="rooms"
                  title="View invited users in the Invite page"
                  action={{
                    label: "Go to Invite",
                    onClick: () => navigate("/invite"),
                  }}
                />
              </div>
            )}

            {tab === "accounts" && (
              <AgentAccountsSection
                financialAccounts={financialAccounts}
                editingAccountId={editingAccountId}
                provider={provider}
                accountNumber={accountNumber}
                accountName={accountName}
                label={label}
                isDefaultAccount={isDefaultAccount}
                savingAccount={savingAccount}
                removingAccountId={removingAccountId}
                accountError={accountError}
                onProviderChange={setProvider}
                onAccountNumberChange={setAccountNumber}
                onAccountNameChange={setAccountName}
                onLabelChange={setLabel}
                onDefaultChange={setIsDefaultAccount}
                onSave={handleSaveAccount}
                onReset={resetAccountForm}
                onEdit={startEditAccount}
                onRemove={handleRemoveAccount}
              />
            )}

            {/* Earnings tab */}
            {tab === "earnings" && (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Total Commission Earned
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <FaCoins className="text-yellow-400 text-lg" />
                      <span className="text-2xl font-black text-yellow-300">
                        {agentStats?.commission ?? 0}
                      </span>
                      <span className="text-xs text-gray-500">coins</span>
                    </div>
                  </div>
                  <FiTrendingUp className="text-yellow-400 text-3xl" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-2">
                  <p className="text-xs text-gray-400">
                    You earn{" "}
                    <span className="text-yellow-300 font-bold">50 coins</span>{" "}
                    for each user who signs up with your referral code.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/invite")}
                    className="text-xs text-emerald-400 font-bold text-left"
                  >
                    View your invite code →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ProofViewerSheet
        open={!!proofSheet}
        url={proofSheet?.url ?? null}
        onClose={() => setProofSheet(null)}
      />
    </div>
  );
}
