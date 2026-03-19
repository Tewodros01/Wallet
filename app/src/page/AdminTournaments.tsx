import { useState } from "react";
import { FaTrophy } from "react-icons/fa";
import { FiArrowLeft, FiCheck, FiPlus, FiX } from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import { useCreateTournament, useFinishTournament, useTournaments } from "../hooks/useTournaments";

function CreateModal({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateTournament();
  const [form, setForm] = useState({
    name: "", subtitle: "", prize: "", entryFee: "", maxPlayers: "100",
    startsAt: "", sponsored: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.startsAt) return;
    create({
      name: form.name,
      subtitle: form.subtitle || undefined,
      prize: parseInt(form.prize) || 0,
      entryFee: parseInt(form.entryFee) || 0,
      maxPlayers: parseInt(form.maxPlayers) || 100,
      startsAt: form.startsAt,
      sponsored: form.sponsored || undefined,
    }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-t-3xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center"><div className="w-10 h-1 bg-white/20 rounded-full" /></div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Create Tournament</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <FiX className="text-gray-400 text-sm" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { key: "name", label: "Name *", placeholder: "e.g. Weekend Bingo Cup", type: "text" },
            { key: "subtitle", label: "Subtitle", placeholder: "e.g. Sponsored by XYZ", type: "text" },
            { key: "prize", label: "Base Prize (coins)", placeholder: "0", type: "number" },
            { key: "entryFee", label: "Entry Fee (coins)", placeholder: "0", type: "number" },
            { key: "maxPlayers", label: "Max Players", placeholder: "100", type: "number" },
            { key: "sponsored", label: "Sponsor Name", placeholder: "optional", type: "text" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">{label}</p>
              <input
                type={type}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50"
              />
            </div>
          ))}
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">Starts At *</p>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-gray-400 text-sm font-bold">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isPending || !form.name || !form.startsAt}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-all">
            {isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiPlus /> Create</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function FinishModal({ tournament, onClose }: { tournament: any; onClose: () => void }) {
  const { mutate: finish, isPending } = useFinishTournament();
  const [winnerUserId, setWinnerUserId] = useState("");

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-t-3xl p-5 flex flex-col gap-4">
        <div className="flex justify-center"><div className="w-10 h-1 bg-white/20 rounded-full" /></div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Finish Tournament</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <FiX className="text-gray-400 text-sm" />
          </button>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
          <p className="text-sm font-black text-white">{tournament.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">Prize pool: {tournament.prize.toLocaleString()} coins</p>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">Winner User ID *</p>
          <input
            type="text"
            placeholder="Paste the winner's user ID"
            value={winnerUserId}
            onChange={(e) => setWinnerUserId(e.target.value.trim())}
            className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-yellow-500/50 font-mono"
          />
          <p className="text-[10px] text-gray-600 mt-1">The winner must be a registered player in this tournament.</p>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-gray-400 text-sm font-bold">Cancel</button>
          <button type="button" disabled={isPending || !winnerUserId}
            onClick={() => finish({ id: tournament.id, winnerUserId }, { onSuccess: onClose })}
            className="flex-1 py-3 rounded-2xl bg-yellow-500 text-black text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-all">
            {isPending ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><FiCheck /> Finish & Pay Out</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  LIVE:      "bg-rose-500/20 text-rose-400 border-rose-500/30",
  UPCOMING:  "bg-violet-500/20 text-violet-400 border-violet-500/30",
  FINISHED:  "bg-gray-500/20 text-gray-500 border-gray-500/30",
  CANCELLED: "bg-gray-500/20 text-gray-500 border-gray-500/30",
};

export default function AdminTournaments() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [finishing, setFinishing] = useState<any | null>(null);

  const { data: tournaments = [], isLoading } = useTournaments();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black text-white leading-tight">Tournaments</p>
              <p className="text-[10px] text-gray-500">{tournaments.length} total</p>
            </div>
          </div>
        }
        right={
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 rounded-xl px-3 py-1.5 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-colors">
            <FiPlus /> New
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-12 flex flex-col gap-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-28 bg-white/[0.04] rounded-2xl animate-pulse" />)
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-600">
            <FaTrophy className="text-3xl" />
            <p className="text-sm font-semibold">No tournaments yet</p>
            <button type="button" onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold">
              Create First Tournament
            </button>
          </div>
        ) : (
          tournaments.map((t: any) => (
            <div key={t.id} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{t.name}</p>
                  {t.subtitle && <p className="text-[11px] text-gray-500 truncate">{t.subtitle}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_STYLE[t.status] ?? ""}`}>
                  {t.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Prize", value: `${t.prize.toLocaleString()}`, icon: <GiCoins className="text-yellow-400" /> },
                  { label: "Entry", value: t.entryFee === 0 ? "Free" : `${t.entryFee}`, icon: <GiCoins className="text-blue-400" /> },
                  { label: "Players", value: `${t.joinedCount}/${t.maxPlayers}`, icon: null },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-black/20 rounded-xl py-2 px-2 flex flex-col gap-0.5">
                    <span className="text-xs">{icon}</span>
                    <p className="text-xs font-black text-white">{value}</p>
                    <p className="text-[9px] text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {(t.status === "LIVE" || t.status === "UPCOMING") && (
                <button type="button" onClick={() => setFinishing(t)}
                  className="w-full py-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-yellow-500/25 transition-colors">
                  <FiCheck /> Finish & Distribute Prize
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      {finishing && <FinishModal tournament={finishing} onClose={() => setFinishing(null)} />}
    </div>
  );
}
