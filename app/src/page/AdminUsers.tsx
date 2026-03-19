import { useState } from "react";
import { FiArrowLeft, FiMinus, FiPlus, FiSearch, FiShield, FiUser, FiUsers } from "react-icons/fi";
import { FaCrown, FaCoins } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import { useAllUsers, useUpdateRole, useAdjustCoins } from "../hooks/useUser";

type RoleFilter = "all" | "USER" | "AGENT" | "ADMIN";

const ROLE_BADGE: Record<string, string> = {
  USER:  "bg-gray-500/15 text-gray-400 border-gray-500/25",
  AGENT: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  ADMIN: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
};

const ROLE_ICON: Record<string, React.ReactNode> = {
  USER:  <FiUser />,
  AGENT: <FiShield />,
  ADMIN: <FaCrown />,
};

const CONFIRM_COLOR: Record<string, string> = {
  USER:  "bg-gray-500",
  AGENT: "bg-emerald-500",
  ADMIN: "bg-yellow-500",
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<RoleFilter>("all");
  const [confirm, setConfirm] = useState<{ id: string; name: string; avatar: string | null; newRole: string } | null>(null);
  const [coinsDialog, setCoinsDialog] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const [coinsAmount, setCoinsAmount] = useState("");
  const [coinsNote, setCoinsNote] = useState("");

  const { data: users = [], isLoading } = useAllUsers();
  const { mutate: updateRole, isPending } = useUpdateRole();
  const { mutate: adjustCoins, isPending: adjustPending } = useAdjustCoins();

  const filtered = (users as any[]).filter((u) => {
    const matchRole   = filter === "all" || u.role === filter;
    const matchSearch = !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const agentCount = (users as any[]).filter((u) => u.role === "AGENT").length;
  const adminCount = (users as any[]).filter((u) => u.role === "ADMIN").length;
  const regularCount = (users as any[]).filter((u) => u.role === "USER").length;

  const handleRoleChange = (u: any, newRole: string) => {
    if (u.role === newRole) return;
    setConfirm({ id: u.id, name: `${u.firstName} ${u.lastName}`, avatar: u.avatar ?? null, newRole });
  };

  const confirmChange = () => {
    if (!confirm) return;
    updateRole({ id: confirm.id, role: confirm.newRole }, { onSuccess: () => setConfirm(null) });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-white leading-tight">Manage Users</p>
              <p className="text-[10px] text-gray-500">
                {isLoading ? "Loading…" : `${(users as any[]).length} users · ${agentCount} agents · ${adminCount} admins`}
              </p>
            </div>
          </div>
        }
        right={
          <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
            <FiUsers className="text-yellow-400 text-sm" />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Header label */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">User Management</p>
          <h1 className="text-xl font-black text-white mt-0.5">Roles & Access</h1>
        </div>

        <div className="flex flex-col gap-5 px-5 pb-12">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total Users", value: isLoading ? "…" : (users as any[]).length, sub: `${regularCount} regular`,  icon: <FiUser />,   from: "from-blue-500",    to: "to-cyan-500",    glow: "rgba(59,130,246,0.3)"  },
              { label: "Agents",      value: isLoading ? "…" : agentCount,              sub: "approve deposits",       icon: <FiShield />, from: "from-emerald-500", to: "to-teal-500",    glow: "rgba(16,185,129,0.3)"  },
              { label: "Admins",      value: isLoading ? "…" : adminCount,              sub: "full access",            icon: <FaCrown />,  from: "from-yellow-500",  to: "to-amber-500",  glow: "rgba(234,179,8,0.3)"   },
              { label: "Showing",     value: isLoading ? "…" : filtered.length,         sub: filter === "all" ? "all roles" : filter, icon: <FiUsers />, from: "from-violet-500", to: "to-purple-500", glow: "rgba(139,92,246,0.3)" },
            ].map(({ label, value, sub, icon, from, to, glow }) => (
              <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-3 py-2.5 flex items-center gap-2.5 overflow-hidden">
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white text-xs shrink-0`}
                  style={{ boxShadow: `0 0 10px ${glow}` }}
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-black text-white leading-none">{value}</p>
                  <p className="text-[10px] font-bold text-white/70 leading-tight mt-0.5">{label}</p>
                  <p className="text-[9px] text-gray-500 leading-tight">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3 focus-within:border-emerald-500/40 transition-all">
            <FiSearch className="text-gray-500 shrink-0 text-sm" />
            <input
              type="text"
              placeholder="Search name, username, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-gray-600 hover:text-gray-400 text-xs font-bold transition-colors">✕</button>
            )}
          </div>

          {/* Role filter tabs */}
          <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1.5">
            {(["all", "USER", "AGENT", "ADMIN"] as RoleFilter[]).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  filter === f
                    ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "text-gray-500 hover:text-gray-300"
                }`}>
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>

          {/* User list */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              {filter === "all" ? "All Users" : `${filter}S`}
            </p>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[68px] bg-white/[0.04] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 text-gray-700">
                <div className="w-14 h-14 rounded-3xl bg-white/[0.04] flex items-center justify-center">
                  <FiUsers className="text-3xl" />
                </div>
                <p className="text-sm font-semibold">No users found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((u: any) => (
                  <div key={u.id} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.07] transition-all">
                    {u.avatar
                      ? <img src={u.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
                      : <div className="w-11 h-11 rounded-full bg-emerald-500/20 ring-2 ring-white/10 shrink-0 flex items-center justify-center text-emerald-400 font-black text-base">{u.firstName?.[0]?.toUpperCase()}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-[11px] text-gray-500 truncate">@{u.username}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${ROLE_BADGE[u.role] ?? ""}`}>
                        {ROLE_ICON[u.role]} {u.role}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setCoinsDialog({ id: u.id, name: `${u.firstName} ${u.lastName}`, avatar: u.avatar ?? null }); setCoinsAmount(""); setCoinsNote(""); }}
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                        >
                          <FaCoins className="text-[9px]" /> Coins
                        </button>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="bg-white/[0.06] border border-white/10 text-gray-400 text-[10px] font-bold rounded-lg px-2 py-0.5 outline-none cursor-pointer"
                        >
                          <option value="USER">USER</option>
                          <option value="AGENT">AGENT</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end justify-center px-5 pb-6">
          <div className="w-full max-w-sm bg-gray-900 border border-white/[0.08] rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 text-center">
              {confirm.avatar
                ? <img src={confirm.avatar} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10" />
                : <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-2xl">{confirm.name[0]}</div>
              }
              <div>
                <p className="text-base font-black text-white">Change Role?</p>
                <p className="text-sm text-gray-400 mt-1">
                  Set <span className="text-white font-bold">{confirm.name}</span> as{" "}
                  <span className={`font-black ${confirm.newRole === "AGENT" ? "text-emerald-400" : confirm.newRole === "ADMIN" ? "text-yellow-400" : "text-gray-300"}`}>
                    {confirm.newRole}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-gray-400 text-sm font-bold active:scale-[0.97] transition-all">
                Cancel
              </button>
              <button type="button" onClick={confirmChange} disabled={isPending}
                className={`flex-1 py-3 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.97] transition-all ${CONFIRM_COLOR[confirm.newRole] ?? "bg-gray-500"}`}>
                {isPending
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Coins dialog */}
      {coinsDialog && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end justify-center px-5 pb-6">
          <div className="w-full max-w-sm bg-gray-900 border border-white/[0.08] rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 text-center">
              {coinsDialog.avatar
                ? <img src={coinsDialog.avatar} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10" />
                : <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-black text-xl">{coinsDialog.name[0]}</div>
              }
              <div>
                <p className="text-base font-black text-white">Adjust Coins</p>
                <p className="text-sm text-gray-400 mt-0.5">{coinsDialog.name}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCoinsAmount((v) => String((parseInt(v || "0") - 100)))} className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0"><FiMinus /></button>
                <input
                  type="number"
                  placeholder="Amount (use - to deduct)"
                  value={coinsAmount}
                  onChange={(e) => setCoinsAmount(e.target.value)}
                  className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold outline-none focus:border-yellow-500/50 text-center"
                />
                <button type="button" onClick={() => setCoinsAmount((v) => String((parseInt(v || "0") + 100)))} className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><FiPlus /></button>
              </div>
              <input
                type="text"
                placeholder="Note (optional)"
                value={coinsNote}
                onChange={(e) => setCoinsNote(e.target.value)}
                className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-yellow-500/50"
              />
            </div>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setCoinsDialog(null)}
                className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-gray-400 text-sm font-bold active:scale-[0.97] transition-all">
                Cancel
              </button>
              <button type="button" disabled={adjustPending || !coinsAmount || isNaN(parseInt(coinsAmount))}
                onClick={() => adjustCoins({ id: coinsDialog.id, amount: parseInt(coinsAmount), note: coinsNote }, { onSuccess: () => setCoinsDialog(null) })}
                className="flex-1 py-3 rounded-2xl bg-yellow-500 text-black text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.97] transition-all">
                {adjustPending ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><FaCoins /> Apply</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
