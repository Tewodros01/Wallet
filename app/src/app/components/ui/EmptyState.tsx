import { motion } from "framer-motion";
import type { ReactNode } from "react";

const ILLUSTRATIONS: Record<string, ReactNode> = {
  rooms: (
    <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.2)" strokeWidth="1.5" />
      <rect x="22" y="28" width="36" height="26" rx="5" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" />
      <circle cx="40" cy="41" r="5" fill="rgba(16,185,129,0.4)" />
      <path d="M32 54 Q40 48 48 54" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  transactions: (
    <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(250,204,21,0.08)" stroke="rgba(250,204,21,0.2)" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="14" fill="rgba(250,204,21,0.15)" stroke="rgba(250,204,21,0.3)" strokeWidth="1.5" />
      <text x="40" y="45" textAnchor="middle" fontSize="14" fill="rgba(250,204,21,0.7)" fontWeight="900">₿</text>
      <path d="M26 26 L54 54M54 26 L26 54" stroke="rgba(250,204,21,0.15)" strokeWidth="1" />
    </svg>
  ),
  missions: (
    <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.2)" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="18" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="40" cy="40" r="8" fill="rgba(99,102,241,0.3)" />
      <circle cx="40" cy="40" r="3" fill="rgba(99,102,241,0.8)" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.2)" strokeWidth="1.5" />
      <path d="M40 22 C33 22 28 27 28 34 L28 44 L24 48 L56 48 L52 44 L52 34 C52 27 47 22 40 22Z" fill="rgba(6,182,212,0.15)" stroke="rgba(6,182,212,0.3)" strokeWidth="1.5" />
      <path d="M36 48 Q40 54 44 48" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  games: (
    <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.2)" strokeWidth="1.5" />
      <rect x="22" y="30" width="36" height="22" rx="6" fill="rgba(249,115,22,0.15)" stroke="rgba(249,115,22,0.3)" strokeWidth="1.5" />
      <circle cx="32" cy="41" r="3" fill="rgba(249,115,22,0.5)" />
      <circle cx="48" cy="41" r="3" fill="rgba(249,115,22,0.5)" />
      <path d="M38 37 L38 45M34 41 L42 41" stroke="rgba(249,115,22,0.5)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  leaderboard: (
    <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(234,179,8,0.08)" stroke="rgba(234,179,8,0.2)" strokeWidth="1.5" />
      <rect x="28" y="44" width="8" height="14" rx="2" fill="rgba(234,179,8,0.3)" />
      <rect x="36" y="36" width="8" height="22" rx="2" fill="rgba(234,179,8,0.5)" />
      <rect x="44" y="40" width="8" height="18" rx="2" fill="rgba(234,179,8,0.3)" />
      <path d="M36 30 L40 22 L44 30 L52 31 L46 37 L48 45 L40 41 L32 45 L34 37 L28 31Z" fill="rgba(234,179,8,0.4)" stroke="rgba(234,179,8,0.5)" strokeWidth="1" />
    </svg>
  ),
};

interface Props {
  type?: keyof typeof ILLUSTRATIONS;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ type = "games", title, subtitle, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-4 py-14 px-6 text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {ILLUSTRATIONS[type]}
      </motion.div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-black text-white">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 px-5 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl active:scale-95 transition-all"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
