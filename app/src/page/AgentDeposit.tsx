import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import {
  FiArrowLeft,
  FiClock,
  FiCreditCard,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { usersApi } from "../api/users.api";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ProofViewerSheet from "../components/payment/ProofViewerSheet";
import { AppBar } from "../components/ui/Layout";
import DepositReviewCard from "../features/payments/components/DepositReviewCard";
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
import { FinancialAccountProvider } from "../types/enums";
import type {
  AgentDepositRequest,
  AgentWithdrawalRequest,
} from "../types/agent-requests.types";
import type { FinancialAccount } from "../types/financial-account.types";

type Tab = "deposits" | "withdrawals" | "users" | "accounts" | "earnings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "deposits",
    label: "Deposits",
    icon: <MdOutlineAccountBalanceWallet />,
  },
  { id: "withdrawals", label: "Withdrawals", icon: <FiTrendingUp /> },
  { id: "users", label: "My Users", icon: <FiUsers /> },
  { id: "accounts", label: "Accounts", icon: <FiCreditCard /> },
  { id: "earnings", label: "Earnings", icon: <FaCoins /> },
];

const ACCOUNT_OPTIONS: {
  value: FinancialAccountProvider;
  label: string;
  helper: string;
}[] = [
  {
    value: FinancialAccountProvider.TELEBIRR,
    label: "Telebirr",
    helper: "Mobile wallet",
  },
  {
    value: FinancialAccountProvider.MPESA,
    label: "M-Pesa",
    helper: "Mobile wallet",
  },
  {
    value: FinancialAccountProvider.CBE_BIRR,
    label: "CBE Birr",
    helper: "Mobile wallet",
  },
  {
    value: FinancialAccountProvider.BOA,
    label: "BOA",
    helper: "Bank account",
  },
  {
    value: FinancialAccountProvider.OTHER_BANK,
    label: "Other Bank",
    helper: "Bank account",
  },
  {
    value: FinancialAccountProvider.OTHER_WALLET,
    label: "Other Wallet",
    helper: "Mobile wallet",
  },
];

export default function AgentDeposit() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("deposits");
  const [dFilter, setDFilter] = useState<string>("all");
  const [wFilter, setWFilter] = useState<string>("all");
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
  const [removingAccountId, setRemovingAccountId] = useState<string | null>(null);

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
      setAccountError(
        getErrorMessage(err, "Failed to save financial account"),
      );
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
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
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
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              className={`${bg} border rounded-2xl py-3 flex flex-col items-center gap-1`}
            >
              <span className={`text-base font-black ${color}`}>{value}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1.5">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${tab === id ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "text-gray-500 hover:text-gray-300"}`}
            >
              <span className="text-sm">{icon}</span>
              {label}
            </button>
          ))}
        </div>

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
                <div className="flex gap-2">
                  {["all", "pending", "completed", "failed"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setDFilter(f)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all ${dFilter === f ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-gray-400 hover:bg-white/10"}`}
                    >
                      {f}
                      {f === "pending" && pendingD > 0 ? ` (${pendingD})` : ""}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  {filteredD.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-gray-600">
                      <FiClock className="text-3xl" />
                      <p className="text-sm font-semibold">
                        No {dFilter} deposits
                      </p>
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
                <div className="flex gap-2">
                  {["all", "pending", "completed", "failed", "rejected"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setWFilter(f)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all ${wFilter === f ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-gray-400 hover:bg-white/10"}`}
                    >
                      {f}
                      {f === "pending" && pendingW > 0 ? ` (${pendingW})` : ""}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  {filteredW.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-gray-600">
                      <FiClock className="text-3xl" />
                      <p className="text-sm font-semibold">
                        No {wFilter} withdrawals
                      </p>
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
              <div className="flex flex-col items-center gap-3 py-12 text-gray-600">
                <FiUsers className="text-3xl" />
                <p className="text-sm font-semibold">
                  View invited users in the Invite page
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/invite")}
                  className="text-xs text-emerald-400 font-bold"
                >
                  Go to Invite →
                </button>
              </div>
            )}

            {tab === "accounts" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 py-3 text-center">
                    <p className="text-base font-black text-emerald-300">
                      {financialAccounts.length}
                    </p>
                    <p className="text-[9px] uppercase tracking-wide text-gray-500">
                      Accounts
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 py-3 text-center">
                    <p className="text-base font-black text-cyan-300">
                      {
                        financialAccounts.filter((account) => account.isDefault)
                          .length
                      }
                    </p>
                    <p className="text-[9px] uppercase tracking-wide text-gray-500">
                      Default
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetAccountForm}
                    className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 py-3 text-center transition-colors hover:bg-yellow-500/15"
                  >
                    <p className="flex items-center justify-center gap-1 text-sm font-black text-yellow-300">
                      <FiPlus /> New
                    </p>
                    <p className="text-[9px] uppercase tracking-wide text-gray-500">
                      Add
                    </p>
                  </button>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {editingAccountId ? "Edit Account" : "Add Financial Account"}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-gray-400">
                        Provider
                      </span>
                      <select
                        title="Financial account provider"
                        aria-label="Financial account provider"
                        value={provider}
                        onChange={(e) =>
                          setProvider(e.target.value as FinancialAccountProvider)
                        }
                        className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white outline-none"
                      >
                        {ACCOUNT_OPTIONS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            className="bg-slate-900"
                          >
                            {option.label} · {option.helper}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-gray-400">
                        Account Number
                      </span>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number or wallet number"
                        className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-gray-400">
                        Account Name
                      </span>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Optional account holder name"
                        className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-gray-400">
                        Label
                      </span>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Optional label like Main payout"
                        className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none"
                      />
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isDefaultAccount}
                        onChange={(e) => setIsDefaultAccount(e.target.checked)}
                      />
                      <span className="text-sm text-white">
                        Make this my default financial account
                      </span>
                    </label>
                  </div>

                  {accountError && (
                    <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                      {accountError}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAccount}
                      disabled={savingAccount}
                      className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {savingAccount
                        ? "Saving..."
                        : editingAccountId
                          ? "Update Account"
                          : "Add Account"}
                    </button>
                    {editingAccountId && (
                      <button
                        type="button"
                        onClick={resetAccountForm}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-gray-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {financialAccounts.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-gray-600">
                      <FiCreditCard className="text-3xl" />
                      <p className="text-sm font-semibold">
                        No financial accounts yet
                      </p>
                      <p className="text-xs text-gray-500">
                        Add Telebirr, M-Pesa, CBE Birr, or bank accounts for user payments.
                      </p>
                    </div>
                  ) : (
                    financialAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-black text-white">
                                {
                                  ACCOUNT_OPTIONS.find(
                                    (option) => option.value === account.provider,
                                  )?.label ?? account.provider
                                }
                              </p>
                              {account.isDefault && (
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="mt-1 font-mono text-sm text-cyan-300">
                              {account.accountNumber}
                            </p>
                            {(account.accountName || account.label) && (
                              <p className="mt-1 text-xs text-gray-500">
                                {[account.accountName, account.label]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEditAccount(account)}
                              className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-gray-300"
                              aria-label={`Edit ${account.provider} account`}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAccount(account.id)}
                              disabled={removingAccountId === account.id}
                              className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 disabled:opacity-60"
                              aria-label={`Remove ${account.provider} account`}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
