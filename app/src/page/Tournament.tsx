import { useEffect, useState } from "react";
import { FaCrown, FaLock, FaTrophy, FaUsers } from "react-icons/fa";
import { FiArrowLeft, FiCheck, FiClock, FiX, FiZap } from "react-icons/fi";
import { GiCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";

type Status = "upcoming" | "live" | "ended";

interface Tournament {
  id: string;
  name: string;
  subtitle: string;
  prize: number;
  entry: number;
  maxPlayers: number;
  joined: number;
  startsAt: Date;
  status: Status;
  gradient: string;
  emoji: string;
  sponsored?: string;
}

const now = new Date();
const h = (hrs: number) => new Date(now.getTime() + hrs * 3600_000);

const TOURNAMENTS: Tournament[] = [
  {
    id: "T001", name: "Friday Night Grand", subtitle: "Weekly flagship tournament",
    prize: 500000, entry: 500, maxPlayers: 200, joined: 187,
    startsAt: h(0.4), status: "live",
    gradient: "from-yellow-500/30 via-orange-500/20 to-rose-500/10",
    emoji: "🏆", sponsored: "Telebirr",
  },
  {
    id: "T002", name: "Beginner's Cup", subtitle: "New players only · Max 50 coins entry",
    prize: 50000, entry: 50, maxPlayers: 100, joined: 64,
    startsAt: h(2), status: "upcoming",
    gradient: "from-emerald-500/25 via-teal-500/15 to-cyan-500/5",
    emoji: "🌱",
  },
  {
    id: "T003", name: "High Rollers", subtitle: "Elite players · Big stakes",
    prize: 2000000, entry: 2000, maxPlayers: 50, joined: 31,
    startsAt: h(5), status: "upcoming",
    gradient: "from-violet-500/30 via-purple-500/20 to-indigo-500/10",
    emoji: "💎",
  },
  {
    id: "T004", name: "Weekend Special", subtitle: "Saturday mega event",
    prize: 1000000, entry: 1000, maxPlayers: 500, joined: 212,
    startsAt: h(20), status: "upcoming",
    gradient: "from-cyan-500/25 via-blue-500/15 to-violet-500/5",
    emoji: "🎉", sponsored: "CBE Birr",
  },
  {
    id: "T005", name: "Morning Rush", subtitle: "Quick 30-min tournament",
    prize: 20000, entry: 100, maxPlayers: 50, joined: 50,
    startsAt: h(-2), status: "ended",
    gradient: "from-gray-500/20 via-gray-500/10 to-transparent",
    emoji: "☀️",
  },
];

const USER_BALANCE = 4000;

function useCountdown(target: Date) {
  const calc = () => Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(t);
  });
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return secs === 0 ? "Starting…" : `${h > 0 ? `${h}h ` : ""}${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

/* ── Join Modal ── */
function JoinModal({ t, onClose, onJoin }: { t: Tournament; onClose: () => void; onJoin: () => void }) {
  const [loading, setLoading] = useState(false);
  const can = USER_BALANCE >= t.entry;

  const confirm = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onJoin(); }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-t-3xl p-5 flex flex-col gap-5">
        <div className="flex justify-center"><div className="w-10 h-1 bg-white/20 rounded-full" /></div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Join Tournament</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <FiX className="text-gray-400 text-sm" />
          </button>
        </div>

        {/* Tournament card */}
        <div className={`bg-gradient-to-br ${t.gradient} border border-white/10 rounded-2xl p-4 flex items-center gap-3`}>
          <span className="text-3xl">{t.emoji}</span>
          <div>
            <p className="text-sm font-black text-white">{t.name}</p>
            <p className="text-xs text-gray-400">{t.subtitle}</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
          {[
            { label: "Entry Fee",     value: t.entry === 0 ? "Free" : `${t.entry.toLocaleString()} coins`, yellow: false },
            { label: "Prize Pool",    value: `${fmt(t.prize)} coins`, yellow: true },
            { label: "Your Balance",  value: `${USER_BALANCE.toLocaleString()} coins`, yellow: false },
            { label: "After Joining", value: `${(USER_BALANCE - t.entry).toLocaleString()} coins`, yellow: false },
          ].map(({ label, value, yellow }, i) => (
            <div key={label} className={`flex justify-between px-4 py-3 ${i < 3 ? "border-b border-white/[0.05]" : ""}`}>
              <span className="text-xs text-gray-500">{label}</span>
              <span className={`text-xs font-black ${yellow ? "text-yellow-300" : "text-white"}`}>{value}</span>
            </div>
          ))}
        </div>

        {!can && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">
            Insufficient balance — need {(t.entry - USER_BALANCE).toLocaleString()} more coins
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-gray-400 text-sm font-bold">Cancel</button>
          <button type="button" onClick={confirm} disabled={!can || loading}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-all">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiCheck /> Confirm & Join</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Tournament Card ── */
function TCard({ t, onJoin }: { t: Tournament; onJoin: (t: Tournament) => void }) {
  const countdown = useCountdown(t.startsAt);
  const fill = Math.round((t.joined / t.maxPlayers) * 100);
  const full = t.joined >= t.maxPlayers;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${t.gradient} border border-white/[0.08] rounded-3xl p-5 flex flex-col gap-4`}>
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{t.emoji}</span>
          {t.status === "live" && (
            <span className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-rose-400">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" /> LIVE
            </span>
          )}
          {t.status === "ended" && (
            <span className="bg-gray-500/20 border border-gray-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black text-gray-500">ENDED</span>
          )}
          {t.sponsored && (
            <span className="bg-white/10 border border-white/10 rounded-full px-2 py-0.5 text-[9px] font-bold text-gray-400">by {t.sponsored}</span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-yellow-400/15 border border-yellow-400/20 rounded-full px-2.5 py-1">
          <GiCoins className="text-yellow-400 text-xs" />
          <span className="text-xs font-black text-yellow-300">{fmt(t.prize)}</span>
        </div>
      </div>

      <div>
        <p className="text-lg font-black text-white">{t.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{t.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <GiCoins className="text-yellow-400" />, label: "Entry", value: t.entry === 0 ? "Free" : `${t.entry}` },
          { icon: <FaUsers className="text-blue-400" />,   label: "Players", value: `${t.joined}/${t.maxPlayers}` },
          { icon: <FiClock className="text-orange-400" />, label: t.status === "live" ? "In Progress" : t.status === "ended" ? "Ended" : "Starts In", value: t.status === "ended" ? "—" : countdown },
        ].map(({ icon, label, value }) => (
          <div key={label} className="bg-black/20 rounded-xl py-2 px-2 flex flex-col gap-0.5">
            <span className="text-xs">{icon}</span>
            <p className="text-xs font-black text-white leading-tight">{value}</p>
            <p className="text-[9px] text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Fill bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{t.joined} joined</span>
          <span>{t.maxPlayers - t.joined} spots left</span>
        </div>
        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${fill > 90 ? "bg-rose-400" : "bg-emerald-400"}`} style={{ width: `${fill}%` }} />
        </div>
      </div>

      {/* Action */}
      {t.status !== "ended" && (
        <button
          type="button"
          disabled={full || t.status === "live"}
          onClick={() => onJoin(t)}
          className={`w-full py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
            t.status === "live"
              ? "bg-rose-500/20 border border-rose-500/30 text-rose-400 cursor-default"
              : full
              ? "bg-white/[0.05] text-gray-600 cursor-not-allowed"
              : "bg-white text-gray-950 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          }`}
        >
          {t.status === "live" ? <><FiZap /> In Progress</> : full ? <><FaLock /> Full</> : <>Register — {t.entry === 0 ? "Free" : `${t.entry} coins`}</>}
        </button>
      )}
    </div>
  );
}

export default function Tournament() {
  const navigate = useNavigate();
  const [joining, setJoining] = useState<Tournament | null>(null);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | Status>("all");

  const filtered = TOURNAMENTS.filter((t) => filter === "all" || t.status === filter);
  const live = TOURNAMENTS.filter((t) => t.status === "live").length;
  const upcoming = TOURNAMENTS.filter((t) => t.status === "upcoming").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/[0.06] px-5 pt-5 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black text-white">Tournaments</p>
              <p className="text-[10px] text-gray-500">{live} live · {upcoming} upcoming</p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <FaTrophy className="text-yellow-400 text-sm" />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1">
          {(["all", "live", "upcoming", "ended"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold capitalize transition-all ${
                filter === f ? "bg-emerald-500 text-white" : "text-gray-500"
              }`}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 pb-10">
        {/* Prize pool banner */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border border-yellow-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <FaCrown className="text-yellow-400 text-xl shrink-0" />
          <div>
            <p className="text-xs font-black text-white">Total Prize Pool This Week</p>
            <p className="text-lg font-black text-yellow-300">3.57M coins</p>
          </div>
        </div>

        {filtered.map((t) => (
          <div key={t.id}>
            <TCard t={t} onJoin={(x) => setJoining(x)} />
            {joined.has(t.id) && (
              <div className="mt-2 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                <FiCheck className="text-emerald-400 text-xs shrink-0" />
                <p className="text-xs text-emerald-400 font-semibold">You're registered for this tournament!</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {joining && (
        <JoinModal
          t={joining}
          onClose={() => setJoining(null)}
          onJoin={() => { setJoined((s) => new Set([...s, joining.id])); setJoining(null); }}
        />
      )}
    </div>
  );
}
