import { useState } from "react";
import { FaCheckCircle, FaCoins, FaExchangeAlt, FaSearch } from "react-icons/fa";
import { FiArrowLeft, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import { useWalletStore } from "../store/wallet.store";

const USERS = [
  { id: "1", name: "Abebe Kebede",  username: "abebe_k",  avatar: "https://i.pravatar.cc/40?img=1",  balance: "2,100" },
  { id: "2", name: "Tigist Alemu",  username: "tigist_a", avatar: "https://i.pravatar.cc/40?img=5",  balance: "850"   },
  { id: "3", name: "Dawit Haile",   username: "dawit_h",  avatar: "https://i.pravatar.cc/40?img=3",  balance: "3,400" },
  { id: "4", name: "Meron Tadesse", username: "meron_t",  avatar: "https://i.pravatar.cc/40?img=9",  balance: "600"   },
  { id: "5", name: "Yonas Girma",   username: "yonas_g",  avatar: "https://i.pravatar.cc/40?img=7",  balance: "1,750" },
  { id: "6", name: "Hana Bekele",   username: "hana_b",   avatar: "https://i.pravatar.cc/40?img=11", balance: "920"   },
];

type User = (typeof USERS)[number];

export default function TransferMoney() {
  const navigate   = useNavigate();
  const balance    = useWalletStore((s) => s.balance);
  const deduct     = useWalletStore((s) => s.deduct);
  const [step,     setStep]     = useState<1 | 2 | 3>(1);
  const [amount,   setAmount]   = useState("");
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState<User | null>(null);

  const parsed    = parseInt(amount.replace(/,/g, ""), 10) || 0;
  const amountErr = parsed > balance ? "Insufficient balance" : parsed < 10 ? "Minimum 10 coins" : "";

  const filtered = USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase()),
  );

  /* ── Step 1: Amount ── */
  if (step === 1)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <AppBar
          left={
            <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08]">
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
              {[100, 200, 500, 1000].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(String(v))}
                  className="bg-white/[0.06] border border-white/[0.08] rounded-xl py-2 text-xs font-bold text-gray-300 active:scale-95 transition-all">
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

  /* ── Step 2: Select User ── */
  if (step === 2)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <AppBar
          left={
            <button type="button" aria-label="Go back" onClick={() => setStep(1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08]">
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
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                <FiX className="text-sm" />
              </button>
            )}
          </div>

          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
            {filtered.length === 0 && <p className="text-center text-sm text-gray-500 py-8">No users found</p>}
            {filtered.map((u, i) => (
              <button key={u.id} type="button"
                onClick={() => { setSelected(u); setStep(3); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.06] transition-colors text-left ${i < filtered.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <FaCoins className="text-yellow-400 text-xs" />
                  <span className="text-xs font-bold text-gray-400">{u.balance}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );

  /* ── Step 3: Confirm ── */
  if (step === 3 && selected)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <AppBar
          left={
            <button type="button" aria-label="Go back" onClick={() => setStep(2)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08]">
              <FiArrowLeft className="text-white text-sm" />
            </button>
          }
          center={<span className="text-base font-black">Confirm Transfer</span>}
        />
        <div className="flex flex-col gap-5 px-5 py-6">
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
            <img src={selected.avatar} alt={selected.name} className="w-14 h-14 rounded-full object-cover" />
            <div>
              <p className="text-base font-black text-white">{selected.name}</p>
              <p className="text-sm text-gray-500">@{selected.username}</p>
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Transfer Summary</p>
            {[
              { label: "Amount",    value: `${parsed.toLocaleString()} coins`, color: "text-cyan-400"  },
              { label: "Fee",       value: "0 coins",                          color: "text-gray-300"  },
              { label: "Recipient", value: selected.name,                      color: "text-gray-300"  },
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

          <SuccessScreen amount={parsed} recipient={selected} onDone={() => navigate("/wallet")} onConfirm={() => deduct(parsed)} />
        </div>
      </div>
    );

  return null;
}

function SuccessScreen({ amount, recipient, onDone, onConfirm }: { amount: number; recipient: User; onDone: () => void; onConfirm: () => void }) {
  const [done, setDone] = useState(false);

  if (done)
    return (
      <div className="flex flex-col items-center gap-5 py-6">
        <div className="w-20 h-20 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
          <FaCheckCircle className="text-cyan-400 text-4xl" />
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-white">Transfer Sent!</p>
          <p className="text-sm text-gray-400 mt-1">
            <span className="text-cyan-400 font-bold">{amount.toLocaleString()} coins</span> sent to{" "}
            <span className="text-white font-bold">{recipient.name}</span>
          </p>
        </div>
        <button type="button" onClick={onDone} className="w-full bg-white/[0.06] border border-white/[0.08] text-white font-black py-4 rounded-2xl active:scale-95 transition-all">
          Back to Wallet
        </button>
      </div>
    );

  return (
    <button type="button"
      onClick={() => { onConfirm(); setDone(true); }}
      className="w-full bg-cyan-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
      <FaExchangeAlt /> Confirm Transfer
    </button>
  );
}
