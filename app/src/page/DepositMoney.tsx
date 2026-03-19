import { useRef, useState } from "react";
import { FaCoins } from "react-icons/fa";
import { FiArrowLeft, FiCheck, FiChevronRight, FiClock, FiLink, FiPaperclip, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { AppBar } from "../components/ui/Layout";
import { useDeposit, useAgents } from "../hooks/usePayments";
import type { PaymentMethod } from "../api/payments.api";

const PRESETS = ["100", "500", "1000", "2000", "5000", "10000"];

type Step = "amount" | "agent" | "confirm" | "pending";

export default function DepositMoney() {
  const navigate = useNavigate();
  const { mutate: deposit, isPending } = useDeposit();
  const { data: agents = [], isLoading: loadingAgents } = useAgents();

  const [step,    setStep]    = useState<Step>("amount");
  const [amount,  setAmount]  = useState("");
  const [agentId, setAgentId] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofMode, setProofMode] = useState<"link" | "file">("link");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedAgent = agents.find((a: any) => a.id === agentId);
  const numAmount = Number(amount) || 0;

  // pick a method from agent — default to TELEBIRR
  const method: PaymentMethod = "TELEBIRR";

  const handleSendRequest = () => {
    setError(null);
    deposit(
      { amount: numAmount, method, proofUrl: proofUrl.trim() || undefined },
      {
        onSuccess: () => setStep("pending"),
        onError: (err: any) => setError(err?.response?.data?.message ?? "Deposit failed"),
      },
    );
  };

  // Step: pending
  if (step === "pending")
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-5 text-white">
        <div className="w-20 h-20 bg-orange-500/15 border border-orange-500/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.2)]">
          <FiClock className="text-orange-400 text-4xl" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Request Sent!</h2>
          <p className="text-gray-400 mt-1 text-sm">
            Your deposit of <span className="text-white font-bold">{numAmount.toLocaleString()} coins</span> is pending agent approval
          </p>
        </div>
        <div className="w-full bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-black text-yellow-300 flex items-center gap-1">
              <FaCoins className="text-xs" />{numAmount.toLocaleString()} coins
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Agent</span>
            <span className="font-bold text-white">{selectedAgent ? `${selectedAgent.firstName} ${selectedAgent.lastName}` : "—"}</span>
          </div>
          {proofUrl && (
            <div className="flex justify-between text-sm gap-2">
              <span className="text-gray-500 shrink-0">Proof</span>
              <span className="font-semibold text-emerald-400 truncate text-right text-xs">{proofUrl.startsWith("data:") ? "File attached" : proofUrl}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="text-orange-400 font-bold flex items-center gap-1"><FiClock className="text-xs" /> Pending Approval</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center">Coins will be credited once the agent approves your request.</p>
        <Button variant="secondary" onClick={() => navigate("/wallet")}>Back to Wallet</Button>
      </div>
    );

  // Step: confirm
  if (step === "confirm")
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <AppBar
          left={
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Go back" onClick={() => setStep("agent")} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
                <FiArrowLeft className="text-white text-sm" />
              </button>
              <span className="text-base font-black">Confirm Deposit</span>
            </div>
          }
        />
        <div className="flex flex-col gap-5 px-5 py-6">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">You are depositing</p>
            <div className="flex items-center gap-2">
              <FaCoins className="text-yellow-400 text-2xl" />
              <span className="text-4xl font-black text-yellow-300">{numAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500">coins</p>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Agent</p>
            <div className="flex items-center gap-3">
              <img src={selectedAgent?.avatar ?? `https://i.pravatar.cc/40?u=${selectedAgent?.id}`} alt={selectedAgent?.firstName} className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30" />
              <div>
                <p className="text-sm font-black text-white">{selectedAgent?.firstName} {selectedAgent?.lastName}</p>
                <p className="text-xs text-gray-500">{selectedAgent?.phone ?? selectedAgent?.username}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Payment Proof <span className="text-gray-600 normal-case tracking-normal font-normal">(optional)</span></p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setProofMode("link")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  proofMode === "link" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/[0.04] border-white/10 text-gray-500"
                }`}>
                <FiLink className="text-sm" /> Link
              </button>
              <button type="button" onClick={() => setProofMode("file")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  proofMode === "file" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/[0.04] border-white/10 text-gray-500"
                }`}>
                <FiPaperclip className="text-sm" /> File
              </button>
            </div>
            {proofMode === "link" ? (
              <input
                type="url"
                placeholder="https://screenshot-link.com/..."
                value={proofUrl.startsWith("data:") ? "" : proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors"
              />
            ) : (
              <div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setProofUrl(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                {proofUrl.startsWith("data:") ? (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                    <FiPaperclip className="text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-400 flex-1 truncate">{proofUrl.startsWith("data:image") ? "Image attached" : "PDF attached"}</span>
                    <button type="button" onClick={() => setProofUrl("")}><FiX className="text-gray-500 text-sm" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-dashed border-white/20 text-xs text-gray-500 flex items-center justify-center gap-2 hover:bg-white/[0.07] transition-colors">
                    <FiPaperclip /> Attach image or PDF
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
            {[
              { step: "1", text: "Send deposit request to agent" },
              { step: "2", text: "Transfer cash to agent physically or via mobile money" },
              { step: "3", text: "Agent approves → coins added to your wallet" },
            ].map(({ step: s, text }) => (
              <div key={s} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-emerald-400">{s}</span>
                </div>
                <p className="text-xs text-gray-400">{text}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">{error}</div>
          )}

          <Button loading={isPending} icon={<FiCheck />} onClick={handleSendRequest}>
            Send Request to Agent
          </Button>
        </div>
      </div>
    );

  // Step: pick agent
  if (step === "agent")
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <AppBar
          left={
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Go back" onClick={() => setStep("amount")} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
                <FiArrowLeft className="text-white text-sm" />
              </button>
              <span className="text-base font-black">Select Agent</span>
            </div>
          }
        />
        <div className="flex flex-col gap-4 px-5 py-6">
          <p className="text-xs text-gray-500">Choose an agent to transfer your deposit to.</p>
          <div className="flex flex-col gap-2">
            {loadingAgents ? (
              [1,2,3].map(i => <div key={i} className="h-16 bg-white/[0.04] rounded-2xl animate-pulse" />)
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-gray-600">
                <FiClock className="text-3xl" />
                <p className="text-sm font-semibold">No agents available</p>
              </div>
            ) : agents.map((agent: any) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => { setAgentId(agent.id); setStep("confirm"); }}
                className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl hover:bg-white/[0.07] active:scale-[0.98] transition-all text-left"
              >
                <img src={agent.avatar ?? `https://i.pravatar.cc/40?u=${agent.id}`} alt={agent.firstName} className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{agent.firstName} {agent.lastName}</p>
                  <p className="text-[11px] text-gray-500">{agent.phone ?? `@${agent.username}`}</p>
                </div>
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Agent
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );

  // Step: enter amount
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <span className="text-base font-black">Deposit Money</span>
          </div>
        }
      />
      <div className="flex flex-col gap-6 px-5 py-6">
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Enter Amount</p>
          <div className="flex items-center gap-2">
            <FaCoins className="text-yellow-400 text-2xl" />
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-4xl font-black text-yellow-300 w-40 outline-none text-center placeholder-gray-700"
            />
          </div>
          <p className="text-xs text-gray-500">coins</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Quick Select</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 border ${
                  amount === p
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                    : "bg-white/[0.05] text-gray-300 border-white/10 hover:bg-white/10"
                }`}
              >
                {Number(p).toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-blue-400 text-lg shrink-0">ℹ️</span>
          <p className="text-xs text-gray-400 leading-relaxed">
            Deposits are processed through an <span className="text-white font-bold">agent</span>. You'll transfer cash to the agent and they'll approve your wallet credit.
          </p>
        </div>

        <Button disabled={!amount || numAmount <= 0} icon={<FiChevronRight />} onClick={() => setStep("agent")}>
          Continue — Select Agent
        </Button>
      </div>
    </div>
  );
}
