import { useState } from "react";
import { FaCheckCircle, FaCoins, FaExchangeAlt, FaSearch } from "react-icons/fa";
import { FiArrowLeft, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import { useTransfer } from "../hooks/usePayments";
import { useAllUsers } from "../hooks/useUser";
import { useAuthStore } from "../store/auth.store";
import { useWalletStore } from "../store/wallet.store";

const PRESETS = [100, 200, 500, 1000];

export default function TransferMoney() {
  const navigate    = useNavigate();
  const balance     = useWalletStore((s) => s.balance);
  const setBalance  = useWalletStore((s) => s.setBalance);
  const currentUser = useAuthStore((s) => s.user);

  const { mutate: transfer, isPending } = useTransfer();
  const { data: allUsers = [], isLoading: loadingUsers } = useAllUsers();

  const [step,     setStep]     = useState<1 | 2 | 3 | 4>(1);
  const [amount,   setAmount]   = useState("");
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [error,    setError]    = useState<string | null>(null);

  const parsed    = parseInt(amount, 10) || 0;
  const amountErr = parsed > balance ? "Insufficient balance" : parsed < 10 ? "Minimum 10 coins" : "";

  const filtered = (allUsers as any[]).filter(
    (u) => u.id !== currentUser?.id && (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase())
    ),
  );

  const handleConfirm = () => {
    if (!selected) return;
    setError(null);
    transfer(
      { recipientUsername: selected.username, amount: parsed },
      {
        onSuccess: () => {
          setBalance(Math.max(0, balance - parsed));
          setStep(4);
        },
        onError: (err: any) => setError(err?.response?.data?.message ?? "Transfer failed"),
      },
    );
  };

  /* ── Step 4: Success ── */
  if (step === 4)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-5 text-white">
        <div className="w-20 h-20 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.2)]">
          <FaCheckCircle className="text-cyan-400 text-4xl" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-white">Transfer Sent!</p>
          <p className="text-sm text-gray-400 mt-1">
            <span className="text-cyan-400 font-bold">{parsed.toLocaleString()} coins</span> sent to{" "}
            <span className="text-white font-bold">{selected?.firstName} {selected?.lastName}</span>
          </p>
        </div>
        <button type="button" onClick={() => navigate("/wallet")}
          className="w-full bg-white/[0.06] border border-white/[0.08] text-white font-black py-4 rounded-2xl active:scale-95 transition-all">
          Back to Wallet
        </button>
      </div>
    );

  /* ── Step 3: Confirm ── */
  if (step === 3 && selected)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <AppBar
          left={
            <button type="button" onClick={() => setStep(2)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08]">
              <FiArrowLeft className="text-white text-sm" />
            </button>
          }
          center={<span className="text-base font-black">Confirm Transfer</span>}
        />
        <div className="flex flex-col gap-5 px-5 py-6">
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
            {selected.avatar
              ? <img src={selected.avatar} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-cyan-500/30 shrink-0" />
              : <div className="w-14 h-14 rounded-full bg-cyan-500/20 ring-2 ring-cyan-500/30 shrink-0 flex items-center justify-center text-cyan-400 font-black text-xl">{selected.firstName?.[0]?.toUpperCase()}</div>
            }
            <div>
              <p className="text-base font-black text-white">{selected.firstName} {selected.lastName}</p>
              <p className="text-sm text-gray-500">@{selected.username}</p>
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Transfer Summary</p>
            {[
              { label: "Amount",    value: `${parsed.toLocaleString()} coins`, color: "text-cyan-400"  },
              { label: "Fee",       value: "0 coins",                          color: "text-gray-300"  },
              { label: "Recipient", value: `${selected.firstName} ${selected.lastName}`, color: "text-gray-300" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
            <div className="border-t border-white/[0.07] pt-3 flex items-center justify-between">
              <span className="text-sm font-bold text-white">Total Deducted</span>
              <div className="flex items-center gap-1">
                <FaCoins className="text-yellow-400 text-xs" />
                <span className="text-base font-black text-yellow-300">{parsed.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">{error}</div>
          )}

          <button type="button" onClick={handleConfirm} disabled={isPending}
            className="w-full bg-cyan-500 disabled:opacity-60 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
            <FaExchangeAlt /> {isPending ? "Sending…" : "Confirm Transfer"}
          </button>
        </div>
      </div>
    );

  /* ── Step 2: Select User ── */
  if (step === 2)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <AppBar
          left={
            <button type="button" onClick={() => setStep(1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08]">
              <FiArrowLeft className="text-white text-sm" />
            </button>
          }
          center={<span className="text-base font-black">Select Recipient</span>}
        />
        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
            <input type="text" placeholder="Search by name or username…"
              value={query} onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                <FiX className="text-sm" />
              </button>
            )}
          </div>

          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
            {loadingUsers ? (
              [1,2,3,4].map(i => <div key={i} className="h-16 bg-white/[0.04] animate-pulse border-b border-white/[0.05] last:border-0" />)
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">No users found</p>
            ) : filtered.map((u, i) => (
              <button key={u.id} type="button"
                onClick={() => { setSelected(u); setStep(3); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.06] transition-colors text-left ${i < filtered.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                {u.avatar
                  ? <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-cyan-500/20 shrink-0 flex items-center justify-center text-cyan-400 font-black">{u.firstName?.[0]?.toUpperCase()}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <FaCoins className="text-yellow-400 text-xs" />
                  <span className="text-xs font-bold text-gray-400">{(u.coinsBalance ?? 0).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );

  /* ── Step 1: Amount ── */
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <button type="button" onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08]">
            <FiArrowLeft className="text-white text-sm" />
          </button>
        }
        center={<span className="text-base font-black">Transfer</span>}
      />
      <div className="flex flex-col gap-6 px-5 py-6">
        <div className="flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3">
          <FaCoins className="text-yellow-400 text-sm" />
          <span className="text-sm text-gray-400">Available:</span>
          <span className="text-sm font-black text-yellow-300">{balance.toLocaleString()} coins</span>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Enter Amount</p>
          <div className="relative">
            <FaCoins className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 text-sm" />
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3.5 text-xl font-black text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          {amountErr && <p className="text-xs text-rose-400 font-semibold">{amountErr}</p>}
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((v) => (
              <button key={v} type="button" onClick={() => setAmount(String(v))}
                className={`rounded-xl py-2 text-xs font-bold active:scale-95 transition-all border ${amount === String(v) ? "bg-cyan-500 text-white border-cyan-500" : "bg-white/[0.06] border-white/[0.08] text-gray-300"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <button type="button" disabled={!parsed || !!amountErr} onClick={() => setStep(2)}
          className="w-full bg-cyan-500 disabled:bg-white/[0.06] disabled:text-gray-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-all">
          Next — Select Recipient
        </button>
      </div>
    </div>
  );
}
