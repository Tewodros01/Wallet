import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  FaCoins,
  FaCrown,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaUserTie,
  FaWallet,
  FaChartLine,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFire,
  FaTrophy,
  FaGift,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiTrendingUp,
  FiBell,
  FiChevronRight,
  FiCheck,
  FiX,
  FiDollarSign,
  FiCreditCard,
  FiShield,
  FiStar,
  FiTarget,
  FiZap,
} from "react-icons/fi";
import { GiCoins, GiTakeMyMoney } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../../../api/users.api";
import { APP_ROUTES } from "../../../config/routes";
import {
  useAgentApproveDeposit,
  useAgentApproveWithdrawal,
  useAgentRejectDeposit,
  useAgentRejectWithdrawal,
  useAgentRequests,
  useAgentStats,
  useMe,
  userKeys,
} from "./hooks";
import { getErrorMessage } from "../../../lib/errors";
import { haptic } from "../../../lib/haptic";
import type {
  AgentDepositRequest,
  AgentWithdrawalRequest,
} from "../../../types/agent-requests.types";
import { FinancialAccountProvider } from "../../../types/enums";
import type { FinancialAccount } from "../../../types/financial-account.types";
import ProofViewerSheet from "../../components/payment/ProofViewerSheet";
import EmptyState from "../../components/ui/EmptyState";
import DepositReviewCard from "../payments/components/DepositReviewCard";
import StatusSegmentedFilter from "../payments/components/StatusSegmentedFilter";
import WithdrawalReviewCard from "../payments/components/WithdrawalReviewCard";
import { paymentKeys } from "../payments/queryKeys";
import AgentAccountsSection from "./components/AgentAccountsSection";
import { AGENT_TABS, type AgentTab } from "./constants";

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

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export default function AgentDeposit() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<AgentTab>("deposits");

  // Listen for tab changes from dashboard navigation
  useEffect(() => {
    const handleSetTab = (event: CustomEvent) => {
      setTab(event.detail);
    };
    window.addEventListener("setAgentTab", handleSetTab as EventListener);
    return () => {
      window.removeEventListener("setAgentTab", handleSetTab as EventListener);
    };
  }, []);
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

  const nav = (path: string) => {
    haptic.light();
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 pt-5 pb-3 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            title="Go back"
            onClick={() => {
              haptic.light();
              navigate(-1);
            }}
            className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-all active:scale-95"
          >
            <FiArrowLeft className="text-white text-lg" />
          </button>
          <div>
            <p className="text-[11px] text-gray-500 font-semibold">
              Agent Dashboard
            </p>
            <p className="text-base font-black text-white leading-tight">
              Financial Control
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1.5">
            <GiCoins className="text-yellow-400 text-sm" />
            <span className="text-sm font-black text-yellow-300">
              {agentStats?.commission ?? 0}
            </span>
          </div>
          {totalPending > 0 && (
            <button
              type="button"
              aria-label="Pending requests"
              className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center relative"
            >
              <FiBell className="text-orange-400 text-sm" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-gray-950 animate-pulse" />
            </button>
          )}
        </div>
      </div>

      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-5 px-5 pb-28 overflow-y-auto"
      >
        {/* ── Hero banner ── */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600/40 via-teal-600/20 to-cyan-600/20 border border-white/8 p-5 min-h-[160px] flex flex-col justify-between mt-4"
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
          <span className="absolute top-4 right-16 text-4xl opacity-20 select-none rotate-12">
            💰
          </span>
          <span className="absolute bottom-6 right-6 text-5xl opacity-15 select-none -rotate-6">
            🏦
          </span>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                <FiShield className="w-3 h-3" />
                Agent Panel
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">
                {totalPending} pending requests
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              Manage Payments &{" "}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-400">
                Earn Commission
              </span>
            </h1>
          </div>

          <div className="relative z-10 flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => nav("/agent-deposits")}
              className="flex items-center gap-2 bg-emerald-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <FaHandHoldingUsd className="text-base" />
              Deposits
            </button>
            <button
              type="button"
              onClick={() => nav("/agent-withdrawals")}
              className="flex items-center gap-2 bg-teal-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(20,184,166,0.35)]"
            >
              <GiTakeMyMoney className="text-base" />
              Withdrawals
            </button>
          </div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5">
          {[
            {
              label: "Pending",
              value: totalPending,
              icon: <FaClock className="text-orange-400" />,
              bg: "bg-orange-400/10 border-orange-400/20",
            },
            {
              label: "Total Deposits",
              value: deposits.length,
              icon: <FaMoneyBillWave className="text-emerald-400" />,
              bg: "bg-emerald-400/10 border-emerald-400/20",
            },
            {
              label: "Withdrawals",
              value: withdrawals.length,
              icon: <FaWallet className="text-cyan-400" />,
              bg: "bg-cyan-400/10 border-cyan-400/20",
            },
            {
              label: "Commission",
              value: agentStats?.commission ?? 0,
              icon: <FaChartLine className="text-yellow-400" />,
              bg: "bg-yellow-400/10 border-yellow-400/20",
            },
          ].map(({ label, value, icon, bg }) => (
            <div
              key={label}
              className={`${bg} border rounded-2xl p-4 flex flex-col gap-2`}
            >
              <span className="text-lg">{icon}</span>
              <p className="text-xl font-black text-white leading-none">
                {String(value)}
              </p>
              <p className="text-[10px] text-gray-500 font-semibold">
                {label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* ── Navigation tabs ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <div className="flex gap-1 rounded-2xl border border-white/7 bg-white/4 p-1 overflow-x-auto no-scrollbar">
            {AGENT_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  haptic.light();
                  setTab(id);
                }}
                aria-pressed={tab === id}
                className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-4 text-[10px] font-bold transition-all whitespace-nowrap min-w-[70px] ${
                  tab === id
                    ? "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)] scale-105"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5 active:scale-95"
                }`}
              >
                <span className="text-base">
                  <Icon />
                </span>
                <span className="leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Content sections ── */}
        {isLoading ? (
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white/4 rounded-2xl animate-pulse"
              />
            ))}
          </motion.div>
        ) : (
          <>
            {/* Deposits tab */}
            {tab === "deposits" && (
              <motion.div variants={fadeUp} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-sm font-black text-white">
                      Deposit Requests
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">
                    {filteredD.length} requests
                  </span>
                </div>

                <StatusSegmentedFilter
                  value={dFilter}
                  options={DEPOSIT_FILTERS}
                  onChange={setDFilter}
                />

                <div className="flex flex-col gap-3">
                  {filteredD.length === 0 ? (
                    <div className="rounded-2xl border border-white/7 bg-white/4 min-h-[200px]">
                      <EmptyState
                        type="transactions"
                        title={`No ${dFilter} deposits`}
                      />
                    </div>
                  ) : (
                    filteredD.map((req: AgentDepositRequest) => (
                      <div
                        key={req.id}
                        className="transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <DepositReviewCard
                          deposit={req}
                          subtitle={`@${req.user?.username ?? "unknown"} · ${req.method}`}
                          actionLoading={approvingD || rejectingD}
                          onShowProof={(url) =>
                            setProofSheet({
                              url,
                            })
                          }
                          onReject={(id) => {
                            haptic.medium();
                            rejectDeposit(id);
                          }}
                          onApprove={(id) => {
                            haptic.success();
                            approveDeposit(id);
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Withdrawals tab */}
            {tab === "withdrawals" && (
              <motion.div variants={fadeUp} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                    <p className="text-sm font-black text-white">
                      Withdrawal Requests
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">
                    {filteredW.length} requests
                  </span>
                </div>

                <StatusSegmentedFilter
                  value={wFilter}
                  options={WITHDRAWAL_FILTERS}
                  onChange={setWFilter}
                  compact
                />

                <div className="flex flex-col gap-3">
                  {filteredW.length === 0 ? (
                    <div className="rounded-2xl border border-white/7 bg-white/4 min-h-[200px]">
                      <EmptyState
                        type="transactions"
                        title={`No ${wFilter} withdrawals`}
                      />
                    </div>
                  ) : (
                    filteredW.map((req: AgentWithdrawalRequest) => (
                      <div
                        key={req.id}
                        className="transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <WithdrawalReviewCard
                          tone="agent"
                          withdrawal={req}
                          subtitle={`${req.method} · ${req.accountNumber}`}
                          details={
                            (req.status === "PENDING" ||
                              req.status === "PROCESSING") && (
                              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-sm text-orange-300">
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 shrink-0" />
                                  <div>
                                    Send{" "}
                                    <span className="font-black">
                                      {req.amount.toLocaleString()} coins
                                    </span>{" "}
                                    worth of cash to{" "}
                                    <span className="font-black">
                                      {req.user?.firstName}
                                    </span>{" "}
                                    via{" "}
                                    <span className="font-black">
                                      {req.method}
                                    </span>{" "}
                                    ({req.accountNumber}), then approve.
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          actionLoading={approvingW || rejectingW}
                          onReject={(id) => {
                            haptic.medium();
                            rejectWithdrawal(id);
                          }}
                          onApprove={(id) => {
                            haptic.success();
                            approveWithdrawal(id);
                          }}
                          approveLabel="Cash Sent & Approve"
                        />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Users tab */}
            {tab === "users" && (
              <motion.div variants={fadeUp} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                    <p className="text-sm font-black text-white">Your Users</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav(APP_ROUTES.invite)}
                    className="flex items-center gap-1 text-xs text-emerald-400 font-bold"
                  >
                    Invite more <FiChevronRight />
                  </button>
                </div>

                <div className="rounded-2xl border border-white/7 bg-white/4 min-h-[200px]">
                  <EmptyState
                    type="rooms"
                    title="View invited users in the Invite page"
                    action={{
                      label: "Go to Invite",
                      onClick: () => nav(APP_ROUTES.invite),
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Accounts tab */}
            {tab === "accounts" && (
              <motion.div variants={fadeUp} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <p className="text-sm font-black text-white">
                      Payment Accounts
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">
                    {financialAccounts.length} accounts
                  </span>
                </div>

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
              </motion.div>
            )}

            {/* Earnings tab */}
            {tab === "earnings" && (
              <motion.div variants={fadeUp} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <p className="text-sm font-black text-white">
                      Commission Earnings
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav(APP_ROUTES.invite)}
                    className="flex items-center gap-1 text-xs text-emerald-400 font-bold"
                  >
                    Earn more <FiChevronRight />
                  </button>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/15 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/10 rounded-full -translate-y-10 translate-x-10" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                          Total Commission Earned
                        </p>
                        <div className="flex items-center gap-2">
                          <GiCoins className="text-yellow-400 text-2xl" />
                          <span className="text-3xl font-black text-yellow-300">
                            {agentStats?.commission ?? 0}
                          </span>
                          <span className="text-sm text-gray-500 mt-2">
                            coins
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-yellow-400/10 rounded-2xl flex items-center justify-center">
                        <FiTrendingUp className="text-yellow-400 text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/4 border border-white/7 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
                      <FaGift className="text-emerald-400 text-lg" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                        You earn{" "}
                        <span className="text-yellow-300 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-lg">
                          50 coins
                        </span>{" "}
                        for each user who signs up with your referral code.
                      </p>
                      <button
                        type="button"
                        onClick={() => nav(APP_ROUTES.invite)}
                        className="text-sm text-emerald-400 font-bold bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors active:scale-95"
                      >
                        View your invite code →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* ── Quick Actions ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <p className="text-sm font-black text-white">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                label: "Deposits",
                sub: `${pendingD} pending`,
                icon: <FaHandHoldingUsd className="text-emerald-400 text-xl" />,
                bg: "from-emerald-500/15 to-green-500/5 border-emerald-500/20",
                path: "/agent-deposits",
              },
              {
                label: "Withdrawals",
                sub: `${pendingW} pending`,
                icon: <GiTakeMyMoney className="text-teal-400 text-xl" />,
                bg: "from-teal-500/15 to-cyan-500/5 border-teal-500/20",
                path: "/agent-withdrawals",
              },
              {
                label: "Recent Actions",
                sub: "View activity log",
                icon: <FaCalendarAlt className="text-violet-400 text-xl" />,
                bg: "from-violet-500/15 to-purple-500/5 border-violet-500/20",
                path: "/agent-actions",
              },
              {
                label: "Accounts",
                sub: `${financialAccounts.length} accounts`,
                icon: <FaWallet className="text-blue-400 text-xl" />,
                bg: "from-blue-500/15 to-indigo-500/5 border-blue-500/20",
                onClick: () => setTab("accounts"),
              },
            ].map(({ label, sub, icon, bg, path, onClick }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => onClick ? onClick() : nav(path)}
                className={`bg-linear-to-br ${bg} border rounded-2xl p-4 flex flex-col gap-3 active:scale-95 transition-all text-left`}
              >
                <div
                  className="w-10 h-10 bg-white/6 rounded-xl flex items-center justify-center"
                  aria-hidden="true"
                >
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{label}</p>
                  <p className="text-[11px] text-gray-500">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <ProofViewerSheet
        open={!!proofSheet}
        url={proofSheet?.url ?? null}
        onClose={() => setProofSheet(null)}
      />
    </div>
  );
}