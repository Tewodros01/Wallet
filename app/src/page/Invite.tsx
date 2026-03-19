import { useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiCopy,
  FiShare2,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import { useAgentStats, useMyInvite } from "../hooks/useAgents";
import type { InvitedUser } from "../types/invite.types";

export default function Invite() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: invite, isLoading } = useMyInvite();
  const { data: stats } = useAgentStats();

  const code = invite?.code ?? "—";
  const inviteLink = invite
    ? `${window.location.origin}/signup?ref=${code}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join Bingo!",
        text: `Use my code ${code} to sign up!`,
        url: inviteLink,
      });
    } else {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const invitedUsers = invite?.invitedUsers ?? [];
  const totalEarned = stats?.commission ?? 0;
  const activeCount = invitedUsers.length;

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
            <span className="text-base font-black">Invite Users</span>
          </div>
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-10">
        {/* Hero */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-violet-500/15 border border-violet-500/25 rounded-2xl flex items-center justify-center">
            <FiUserPlus className="text-violet-400 text-2xl" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Invite & Earn</h2>
            <p className="text-xs text-gray-400 mt-1">
              Earn <span className="text-yellow-300 font-bold">50 coins</span>{" "}
              for every user you invite who joins
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "Invited",
              value: String(invitedUsers.length),
              color: "text-white",
            },
            {
              label: "Active",
              value: String(activeCount),
              color: "text-emerald-400",
            },
            {
              label: "Earned",
              value: String(totalEarned),
              color: "text-yellow-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3 flex flex-col items-center gap-1"
            >
              <span className={`text-lg font-black ${color}`}>
                {isLoading ? "—" : value}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Referral code */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Your Referral Code
          </p>
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <span className="text-xl font-black tracking-widest text-white">
              {isLoading ? "Loading..." : code}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 text-gray-300 border border-white/10 hover:bg-white/15"}`}
            >
              {copied ? <FiCheck /> : <FiCopy />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Share */}
        <button
          type="button"
          onClick={handleShareLink}
          className="w-full bg-violet-500/10 border border-violet-500/20 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-violet-400 font-bold text-sm hover:bg-violet-500/15 transition-colors active:scale-[0.98]"
        >
          <FiShare2 />
          Share Invite Link
        </button>

        {/* Invited users list */}
        {invitedUsers.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                People You Invited
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FiUsers className="text-xs" />
                <span>{invitedUsers.length} total</span>
              </div>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
              {invitedUsers.map((u: InvitedUser, i: number) => (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i < invitedUsers.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                >
                  <img
                    src={u.avatar ?? `https://i.pravatar.cc/40?u=${u.id}`}
                    alt={u.username}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      @{u.username} · Joined{" "}
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {invitedUsers.length === 0 && !isLoading && (
          <div className="flex flex-col items-center gap-3 py-8 text-gray-600">
            <FiUsers className="text-3xl" />
            <p className="text-sm font-semibold">No invites yet</p>
            <p className="text-xs text-gray-700">
              Share your code to start earning!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
