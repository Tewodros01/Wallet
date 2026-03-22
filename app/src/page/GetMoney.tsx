import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import {
  FiArrowLeft,
  FiArrowUp,
  FiCheck,
  FiChevronRight,
  FiCreditCard,
  FiSmartphone,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  AgentSummaryCard,
  PaymentAmountHero,
  PaymentFlowHeader,
  PaymentStatusScreen,
} from "../components/payment/PaymentFlow";
import Button from "../components/ui/Button";
import { AppBar } from "../components/ui/Layout";
import { APP_ROUTES } from "../config/routes";
import { useAgents, useWithdraw } from "../hooks/usePayments";
import { getErrorMessage } from "../lib/errors";
import { useWalletStore } from "../store/wallet.store";
import { PaymentMethod } from "../types/enums";
import type { Agent } from "../types/withdrawal.types";

const PRESETS = ["100", "500", "1000", "2000", "5000"];

const METHODS: {
  id: PaymentMethod;
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}[] = [
  {
    id: PaymentMethod.TELEBIRR,
    label: "Telebirr",
    sub: "Instant · 0% fee",
    icon: <FiSmartphone />,
    color: "text-violet-400",
    bg: "bg-violet-500/15 border-violet-500/25",
  },
  {
    id: PaymentMethod.MPESA,
    label: "M-Pesa",
    sub: "Instant · 0% fee",
    icon: <FiSmartphone />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/25",
  },
  {
    id: PaymentMethod.CBE_BIRR,
    label: "CBE Birr",
    sub: "1–2 hrs · 0% fee",
    icon: <FiCreditCard />,
    color: "text-blue-400",
    bg: "bg-blue-500/15 border-blue-500/25",
  },
  {
    id: PaymentMethod.BANK_CARD,
    label: "Bank Card",
    sub: "1–3 days · 1.5% fee",
    icon: <FiCreditCard />,
    color: "text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/25",
  },
];

type Step = "amount" | "agent" | "confirm" | "pending";

export default function GetMoney() {
  const navigate = useNavigate();
  const { balance, setBalance } = useWalletStore();
  const { mutate: withdraw, isPending } = useWithdraw();

  const { data: agents = [], isLoading: loadingAgents } = useAgents();

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [agentId, setAgentId] = useState<string | null>(null);
  const [method, setMethod] = useState(PaymentMethod.TELEBIRR);
  const [accountNum, setAccountNum] = useState("");
  const [error, setError] = useState<string | null>(null);

  const numAmount = Number(amount) || 0;
  const insufficient = numAmount > balance;
  const selectedAgent = agents.find((a: Agent) => a.id === agentId);
  const selectedMethod = METHODS.find((m) => m.id === method)!;

  const handleSendRequest = () => {
    if (!selectedAgent || !accountNum.trim()) return;
    setError(null);
    withdraw(
      { amount: numAmount, method, accountNumber: accountNum.trim() },
      {
        onSuccess: () => {
          setBalance(Math.max(0, balance - numAmount));
          setStep("pending");
        },
        onError: (err: Error) => {
          const errorMessage = getErrorMessage(err, "Withdrawal failed");
          setError(errorMessage);
        },
      },
    );
  };

  // ── Pending ──
  if (step === "pending")
    return (
      <PaymentStatusScreen
        icon={
          <div className="w-20 h-20 bg-orange-500/15 border border-orange-500/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.25)] animate-pulse">
            <FiArrowUp className="text-orange-400 text-4xl" />
          </div>
        }
        title="Request Sent!"
        description={
          <>
            Waiting for{" "}
            <span className="text-white font-bold">
              {selectedAgent
                ? `${selectedAgent.firstName} ${selectedAgent.lastName}`
                : "agent"}
            </span>{" "}
            to process your withdrawal
          </>
        }
        rows={[
          {
            label: "Amount",
            value: (
              <span className="flex items-center gap-1 font-black text-yellow-300">
                <FaCoins className="text-xs text-yellow-400" />
                {numAmount.toLocaleString()} coins
              </span>
            ),
          },
          {
            label: "Agent",
            value: (
              <span className="font-bold text-white">
                {selectedAgent
                  ? `${selectedAgent.firstName} ${selectedAgent.lastName}`
                  : "—"}
              </span>
            ),
          },
          {
            label: "Payout via",
            value: (
              <span className="font-bold text-white">
                {selectedMethod.label}
              </span>
            ),
          },
          {
            label: "Status",
            value: (
              <span className="text-orange-400 font-bold">Processing</span>
            ),
          },
        ]}
        primaryAction={{
          label: "Back to Wallet",
          onClick: () => navigate(APP_ROUTES.wallet),
        }}
        secondaryAction={{
          label: "Track all withdrawals →",
          onClick: () => navigate(APP_ROUTES.withdrawalStatus),
        }}
      />
    );
  if (step === "confirm")
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <PaymentFlowHeader
          title="Confirm Withdrawal"
          onBack={() => setStep("agent")}
        />
        <div className="flex flex-col gap-5 px-5 py-6">
          <PaymentAmountHero
            eyebrow="You are withdrawing"
            amount={numAmount}
            helperText="coins → cash"
            tone="rose"
          />

          <AgentSummaryCard
            agent={selectedAgent}
            tone="rose"
            contact={
              selectedAgent?.phone ?? `@${selectedAgent?.username ?? ""}`
            }
          />

          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Your Account Number
            </p>
            <input
              type="text"
              aria-label="Account number"
              placeholder="e.g. +251912345678"
              value={accountNum}
              onChange={(e) => setAccountNum(e.target.value)}
              className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-rose-500/50 transition-colors"
            />
            <p className="text-[11px] text-gray-600">
              The agent will send cash to this account via{" "}
              {selectedMethod.label}.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Receive Cash Via
            </p>
            <div className="flex flex-col gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98] ${method === m.id ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.07]"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${m.bg} border flex items-center justify-center shrink-0`}
                  >
                    <span className={m.color}>{m.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-white">{m.label}</p>
                    <p className="text-[11px] text-gray-500">{m.sub}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${method === m.id ? "border-emerald-500 bg-emerald-500" : "border-gray-600"}`}
                  >
                    {method === m.id && (
                      <FiCheck className="text-white text-[10px]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">
              {error}
            </div>
          )}

          <Button
            loading={isPending}
            disabled={!accountNum.trim()}
            icon={<FiArrowUp />}
            onClick={handleSendRequest}
          >
            Send Withdrawal Request
          </Button>
        </div>
      </div>
    );

  // ── Select agent ──
  if (step === "agent")
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <AppBar
          left={
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Go back"
                title="Go back"
                onClick={() => setStep("amount")}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
              >
                <FiArrowLeft className="text-white text-sm" />
              </button>
              <span className="text-base font-black">Select Agent</span>
            </div>
          }
        />
        <div className="flex flex-col gap-4 px-5 py-6">
          <p className="text-xs text-gray-500">
            Choose an agent to process your withdrawal.
          </p>
          <div className="flex flex-col gap-2">
            {loadingAgents ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-white/[0.04] rounded-2xl animate-pulse"
                />
              ))
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-gray-600">
                <FiArrowUp className="text-3xl" />
                <p className="text-sm font-semibold">No agents available</p>
              </div>
            ) : (
              agents.map((agent: Agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    setAgentId(agent.id);
                    setStep("confirm");
                  }}
                  className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl hover:bg-white/[0.07] active:scale-[0.98] transition-all text-left"
                >
                  {agent.avatar ? (
                    <img
                      src={agent.avatar}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-500/20 ring-2 ring-white/10 shrink-0 flex items-center justify-center text-emerald-400 font-black">
                      {agent.firstName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">
                      {agent.firstName} {agent.lastName}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {agent.phone ?? `@${agent.username}`}
                    </p>
                  </div>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Agent
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );

  // ── Amount ──
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
            <span className="text-base font-black">Withdraw Money</span>
          </div>
        }
        right={
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1.5">
            <FaCoins className="text-yellow-400 text-xs" />
            <span className="text-yellow-300 text-xs font-black">
              {balance.toLocaleString()}
            </span>
          </div>
        }
      />
      <div className="flex flex-col gap-6 px-5 py-6">
        <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/5 border border-rose-500/20 rounded-2xl p-5 flex flex-col items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Available Balance
          </p>
          <div className="flex items-center gap-2">
            <FaCoins className="text-yellow-400 text-2xl" />
            <span className="text-4xl font-black text-yellow-300">
              {balance.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-500">coins</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Withdraw Amount
          </p>
          <div
            className={`bg-white/[0.06] border rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all ${insufficient ? "border-rose-500/50" : "border-white/10 focus-within:border-emerald-500"}`}
          >
            <FiArrowUp
              className={insufficient ? "text-rose-400" : "text-gray-500"}
            />
            <input
              type="number"
              aria-label="Withdraw amount"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
            />
            <span className="text-xs text-gray-500 shrink-0">coins</span>
          </div>
          {insufficient && (
            <p className="text-xs text-rose-400 font-medium">
              Exceeds available balance
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Quick Select
          </p>
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${amount === p ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-white/[0.05] text-gray-300 border-white/10 hover:bg-white/10"}`}
              >
                {Number(p).toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-blue-400 text-lg shrink-0">ℹ️</span>
          <p className="text-xs text-gray-400 leading-relaxed">
            Withdrawals are processed through an{" "}
            <span className="text-white font-bold">agent</span>. Select an agent
            and payout method.
          </p>
        </div>

        <Button
          disabled={!amount || numAmount <= 0 || insufficient}
          icon={<FiChevronRight />}
          onClick={() => setStep("agent")}
        >
          Continue — Select Agent
        </Button>
      </div>
    </div>
  );
}
