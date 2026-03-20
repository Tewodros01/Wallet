import { useEffect, useRef, useState } from "react";
import { FaCoins, FaCrown } from "react-icons/fa";
import {
  FiArrowLeft,
  FiChevronDown,
  FiMinus,
  FiPlus,
  FiSearch,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import {
  useAdjustCoins,
  useAllUsers,
  useBanUser,
  useUnbanUser,
  useUpdateRole,
} from "../hooks/useUser";
import { Role, type User } from "../types";

type RoleFilter = "all" | Role;

const ROLE_BADGE: Record<Role, string> = {
  [Role.USER]: "bg-gray-500/15 text-gray-400 border-gray-500/25",
  [Role.AGENT]: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  [Role.ADMIN]: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
};

const ROLE_ICON: Record<Role, React.ReactNode> = {
  [Role.USER]: <FiUser />,
  [Role.AGENT]: <FiShield />,
  [Role.ADMIN]: <FaCrown />,
};

const CONFIRM_COLOR: Record<Role, string> = {
  [Role.USER]: "bg-gray-500",
  [Role.AGENT]: "bg-emerald-500",
  [Role.ADMIN]: "bg-yellow-500",
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const roleMenuRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [openRoleMenuId, setOpenRoleMenuId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    id: string;
    name: string;
    avatar: string | null;
    newRole: Role;
  } | null>(null);
  const [coinsDialog, setCoinsDialog] = useState<{
    id: string;
    name: string;
    avatar: string | null;
  } | null>(null);
  const [coinsAmount, setCoinsAmount] = useState("");
  const [coinsNote, setCoinsNote] = useState("");

  const { data: users = [], isLoading } = useAllUsers();
  const { mutate: updateRole, isPending } = useUpdateRole();
  const { mutate: adjustCoins, isPending: adjustPending } = useAdjustCoins();
  const { mutate: banUser, isPending: banPending } = useBanUser();
  const { mutate: unbanUser, isPending: unbanPending } = useUnbanUser();
  const [banConfirm, setBanConfirm] = useState<{
    id: string;
    name: string;
    banned: boolean;
  } | null>(null);

  useEffect(() => {
    if (!openRoleMenuId) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!roleMenuRef.current?.contains(event.target as Node)) {
        setOpenRoleMenuId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenRoleMenuId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openRoleMenuId]);

  const filtered = (users as User[]).filter((u) => {
    const matchRole = filter === "all" || u.role === filter;
    const matchSearch =
      !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const agentCount = (users as User[]).filter(
    (u) => u.role === Role.AGENT && !u.deletedAt,
  ).length;
  const adminCount = (users as User[]).filter(
    (u) => u.role === Role.ADMIN && !u.deletedAt,
  ).length;
  const regularCount = (users as User[]).filter(
    (u) => u.role === Role.USER && !u.deletedAt,
  ).length;

  const handleRoleChange = (u: User, newRole: Role) => {
    setOpenRoleMenuId(null);
    if (u.role === newRole) return;
    setConfirm({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      avatar: u.avatar ?? null,
      newRole,
    });
  };

  const confirmChange = () => {
    if (!confirm) return;
    updateRole(
      { id: confirm.id, role: confirm.newRole },
      { onSuccess: () => setConfirm(null) },
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              title="Go back"
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-white leading-tight">
                Manage Users
              </p>
              <p className="text-[10px] text-gray-500">
                {isLoading
                  ? "Loading…"
                  : `${(users as User[]).length} users · ${agentCount} agents · ${adminCount} admins`}
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
          <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">
            User Management
          </p>
          <h1 className="text-xl font-black text-white mt-0.5">
            Roles & Access
          </h1>
        </div>

        <div className="flex flex-col gap-5 px-5 pb-12">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Total Users",
                value: isLoading ? "…" : (users as User[]).length,
                sub: `${regularCount} regular`,
                icon: <FiUser />,
                from: "from-blue-500",
                to: "to-cyan-500",
                glow: "rgba(59,130,246,0.3)",
              },
              {
                label: "Agents",
                value: isLoading ? "…" : agentCount,
                sub: "approve deposits",
                icon: <FiShield />,
                from: "from-emerald-500",
                to: "to-teal-500",
                glow: "rgba(16,185,129,0.3)",
              },
              {
                label: "Admins",
                value: isLoading ? "…" : adminCount,
                sub: "full access",
                icon: <FaCrown />,
                from: "from-yellow-500",
                to: "to-amber-500",
                glow: "rgba(234,179,8,0.3)",
              },
              {
                label: "Showing",
                value: isLoading ? "…" : filtered.length,
                sub: filter === "all" ? "all roles" : filter,
                icon: <FiUsers />,
                from: "from-violet-500",
                to: "to-purple-500",
                glow: "rgba(139,92,246,0.3)",
              },
            ].map(({ label, value, sub, icon, from, to, glow }) => (
              <div
                key={label}
                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-3 py-2.5 flex items-center gap-2.5 overflow-hidden"
              >
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white text-xs shrink-0`}
                  style={{ boxShadow: `0 0 10px ${glow}` }}
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-black text-white leading-none">
                    {value}
                  </p>
                  <p className="text-[10px] font-bold text-white/70 leading-tight mt-0.5">
                    {label}
                  </p>
                  <p className="text-[9px] text-gray-500 leading-tight">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3 focus-within:border-emerald-500/40 transition-all">
            <FiSearch className="text-gray-500 shrink-0 text-sm" />
            <input
              type="text"
              aria-label="Search users"
              placeholder="Search name, username, email…"
              value={search}
              onChange={(e) => {
                setOpenRoleMenuId(null);
                setSearch(e.target.value);
              }}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setOpenRoleMenuId(null);
                  setSearch("");
                }}
                aria-label="Clear search"
                title="Clear search"
                className="text-gray-600 hover:text-gray-400 text-xs font-bold transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role filter tabs */}
          <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1.5">
            {(["all", Role.USER, Role.AGENT, Role.ADMIN] as RoleFilter[]).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setOpenRoleMenuId(null);
                    setFilter(f);
                  }}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                    filter === f
                      ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ),
            )}
          </div>

          {/* User list */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              {filter === "all" ? "All Users" : `${filter}S`}
            </p>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-[68px] bg-white/[0.04] rounded-2xl animate-pulse"
                  />
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
                {filtered.map((u: User) =>
                  (() => {
                    const isRoleMenuOpen = openRoleMenuId === u.id;
                    const roleMenuId = `role-menu-${u.id}`;

                    return (
                      <div
                        key={u.id}
                        className={`bg-white/[0.04] border rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.07] transition-all ${u.deletedAt ? "border-rose-500/20 opacity-60" : "border-white/[0.07]"}`}
                      >
                        <button
                          type="button"
                          className="flex flex-1 items-center gap-3 min-w-0 text-left"
                          onClick={() => {
                            if (u.role === "AGENT") {
                              navigate(`/admin/agents/${u.id}`);
                            } else {
                              navigate(`/admin/users/${u.id}`);
                            }
                          }}
                        >
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt=""
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-emerald-500/20 ring-2 ring-white/10 shrink-0 flex items-center justify-center text-emerald-400 font-black text-base">
                              {u.firstName?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              @{u.username}
                            </p>
                          </div>
                        </button>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span
                            className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${ROLE_BADGE[u.role] ?? ""}`}
                          >
                            {ROLE_ICON[u.role]} {u.role}
                          </span>
                          {u.deletedAt && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
                              BANNED
                            </span>
                          )}
                          <div
                            className="flex items-center gap-1.5 relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenRoleMenuId(null);
                                setCoinsDialog({
                                  id: u.id,
                                  name: `${u.firstName} ${u.lastName}`,
                                  avatar: u.avatar ?? null,
                                });
                              }}
                              aria-label={`Adjust coins for ${u.firstName} ${u.lastName}`}
                              className="flex items-center gap-1 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-[10px] font-bold text-yellow-400 transition-colors hover:bg-yellow-500/20"
                            >
                              <FaCoins className="text-[11px]" />
                              Coins
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenRoleMenuId(null);
                                setBanConfirm({
                                  id: u.id,
                                  name: `${u.firstName} ${u.lastName}`,
                                  banned: !!u.deletedAt,
                                });
                              }}
                              aria-label={
                                u.deletedAt
                                  ? `Unban ${u.firstName} ${u.lastName}`
                                  : `Ban ${u.firstName} ${u.lastName}`
                              }
                              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                                u.deletedAt
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                              }`}
                            >
                              {u.deletedAt ? "Unban" : "Ban"}
                            </button>
                            <div
                              ref={isRoleMenuOpen ? roleMenuRef : null}
                              className="relative"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenRoleMenuId((current) =>
                                    current === u.id ? null : u.id,
                                  );
                                }}
                                aria-haspopup="menu"
                                aria-label={`Change role for ${u.firstName} ${u.lastName}`}
                                className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors backdrop-blur-sm ${ROLE_BADGE[u.role] ?? "bg-white/[0.06] border-white/10 text-gray-300"}`}
                              >
                                {ROLE_ICON[u.role]}
                                <span>{u.role}</span>
                                <FiChevronDown
                                  className={`text-[11px] transition-transform ${isRoleMenuOpen ? "rotate-180" : ""}`}
                                />
                              </button>

                              {isRoleMenuOpen && (
                                <div
                                  id={roleMenuId}
                                  role="menu"
                                  className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[140px] rounded-2xl border border-white/10 bg-gray-900/95 p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                                >
                                  {[Role.USER, Role.AGENT, Role.ADMIN].map(
                                    (role) => (
                                      <button
                                        key={role}
                                        type="button"
                                        role="menuitem"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRoleChange(u, role);
                                        }}
                                        className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[11px] font-bold transition-colors ${
                                          u.role === role
                                            ? `${ROLE_BADGE[role]}`
                                            : "text-gray-300 hover:bg-white/[0.06]"
                                        }`}
                                      >
                                        <span className="flex items-center gap-2">
                                          {ROLE_ICON[role]}
                                          {role}
                                        </span>
                                        {u.role === role && (
                                          <span className="text-[9px] uppercase tracking-wide">
                                            Current
                                          </span>
                                        )}
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })(),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ban confirm dialog */}
      {banConfirm && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end justify-center px-5 pb-6">
          <div className="w-full max-w-sm bg-gray-900 border border-white/[0.08] rounded-3xl p-6 flex flex-col gap-5">
            <div className="text-center">
              <p className="text-base font-black text-white">
                {banConfirm.banned ? "Unban User?" : "Ban User?"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {banConfirm.banned ? (
                  <>
                    Restore access for{" "}
                    <span className="text-white font-bold">
                      {banConfirm.name}
                    </span>
                    ?
                  </>
                ) : (
                  <>
                    Block{" "}
                    <span className="text-white font-bold">
                      {banConfirm.name}
                    </span>{" "}
                    from logging in?
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setBanConfirm(null)}
                className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-gray-400 text-sm font-bold active:scale-[0.97] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={banPending || unbanPending}
                onClick={() => {
                  const fn = banConfirm.banned ? unbanUser : banUser;
                  fn(banConfirm.id, { onSuccess: () => setBanConfirm(null) });
                }}
                className={`flex-1 py-3 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.97] transition-all ${
                  banConfirm.banned ? "bg-emerald-500" : "bg-rose-500"
                }`}
              >
                {banPending || unbanPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : banConfirm.banned ? (
                  "Unban"
                ) : (
                  "Ban"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end justify-center px-5 pb-6">
          <div className="w-full max-w-sm bg-gray-900 border border-white/[0.08] rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 text-center">
              {confirm.avatar ? (
                <img
                  src={confirm.avatar}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-2xl">
                  {confirm.name[0]}
                </div>
              )}
              <div>
                <p className="text-base font-black text-white">Change Role?</p>
                <p className="text-sm text-gray-400 mt-1">
                  Set{" "}
                  <span className="text-white font-bold">{confirm.name}</span>{" "}
                  as{" "}
                  <span
                    className={`font-black ${confirm.newRole === "AGENT" ? "text-emerald-400" : confirm.newRole === "ADMIN" ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    {confirm.newRole}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-gray-400 text-sm font-bold active:scale-[0.97] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmChange}
                disabled={isPending}
                className={`flex-1 py-3 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.97] transition-all ${CONFIRM_COLOR[confirm.newRole] ?? "bg-gray-500"}`}
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Confirm"
                )}
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
              {coinsDialog.avatar ? (
                <img
                  src={coinsDialog.avatar}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-black text-xl">
                  {coinsDialog.name[0]}
                </div>
              )}
              <div>
                <p className="text-base font-black text-white">Adjust Coins</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {coinsDialog.name}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCoinsAmount((v) => String(parseInt(v || "0") - 100))
                  }
                  aria-label="Decrease coins by 100"
                  className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0"
                >
                  <FiMinus />
                </button>
                <input
                  type="number"
                  aria-label="Coin adjustment amount"
                  placeholder="Amount (use - to deduct)"
                  value={coinsAmount}
                  onChange={(e) => setCoinsAmount(e.target.value)}
                  className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold outline-none focus:border-yellow-500/50 text-center"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCoinsAmount((v) => String(parseInt(v || "0") + 100))
                  }
                  aria-label="Increase coins by 100"
                  className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"
                >
                  <FiPlus />
                </button>
              </div>
              <input
                type="text"
                aria-label="Coin adjustment note"
                placeholder="Note (optional)"
                value={coinsNote}
                onChange={(e) => setCoinsNote(e.target.value)}
                className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-yellow-500/50"
              />
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setCoinsDialog(null)}
                className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-gray-400 text-sm font-bold active:scale-[0.97] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  adjustPending || !coinsAmount || isNaN(parseInt(coinsAmount))
                }
                onClick={() =>
                  adjustCoins(
                    {
                      id: coinsDialog.id,
                      amount: parseInt(coinsAmount),
                      note: coinsNote,
                    },
                    { onSuccess: () => setCoinsDialog(null) },
                  )
                }
                className="flex-1 py-3 rounded-2xl bg-yellow-500 text-black text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.97] transition-all"
              >
                {adjustPending ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <FaCoins /> Apply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
