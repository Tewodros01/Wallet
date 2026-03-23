import type { ReactNode } from "react";
import { FaCoins } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import type { Agent } from "../../../types/withdrawal.types";
import Button from "../ui/Button";
import { AppBar } from "../ui/Layout";

type PaymentTone = "emerald" | "rose" | "orange";

interface ToneConfig {
  hero: string;
  ring: string;
  fallbackAvatar: string;
}

interface SummaryRow {
  label: string;
  value: ReactNode;
}

interface PaymentFlowHeaderProps {
  title: string;
  onBack: () => void;
}

interface PaymentAmountHeroProps {
  eyebrow: string;
  amount: number;
  helperText: string;
  tone: PaymentTone;
}

interface AgentSummaryCardProps {
  agent?: Agent;
  tone: PaymentTone;
  contact: string;
}

interface SummaryCardProps {
  rows: SummaryRow[];
}

interface StatusScreenProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  rows: SummaryRow[];
  footer?: ReactNode;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const TONE_CONFIG: Record<PaymentTone, ToneConfig> = {
  emerald: {
    hero: "bg-linear-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20",
    ring: "ring-emerald-500/30",
    fallbackAvatar: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
  },
  rose: {
    hero: "bg-linear-to-br from-rose-500/10 to-orange-500/5 border border-rose-500/20",
    ring: "ring-rose-500/30",
    fallbackAvatar: "bg-rose-500/20 text-rose-400 ring-rose-500/30",
  },
  orange: {
    hero: "bg-orange-500/15 border border-orange-500/30",
    ring: "ring-orange-500/30",
    fallbackAvatar: "bg-orange-500/20 text-orange-400 ring-orange-500/30",
  },
};

export function PaymentFlowHeader({ title, onBack }: PaymentFlowHeaderProps) {
  return (
    <AppBar
      left={
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            title="Go back"
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <FiArrowLeft className="text-white text-sm" />
          </button>
          <span className="text-base font-black">{title}</span>
        </div>
      }
    />
  );
}

export function PaymentAmountHero({
  eyebrow,
  amount,
  helperText,
  tone,
}: PaymentAmountHeroProps) {
  return (
    <div
      className={`${TONE_CONFIG[tone].hero} rounded-2xl p-5 flex flex-col items-center gap-3`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        {eyebrow}
      </p>
      <div className="flex items-center gap-2">
        <FaCoins className="text-yellow-400 text-2xl" />
        <span className="text-4xl font-black text-yellow-300">
          {amount.toLocaleString()}
        </span>
      </div>
      <p className="text-xs text-gray-500">{helperText}</p>
    </div>
  );
}

export function AgentSummaryCard({
  agent,
  tone,
  contact,
}: AgentSummaryCardProps) {
  const toneConfig = TONE_CONFIG[tone];

  return (
    <div className="bg-white/4 border border-white/7 rounded-2xl p-4 flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        Agent
      </p>
      <div className="flex items-center gap-3">
        {agent?.avatar ? (
          <img
            src={agent.avatar}
            alt={agent.firstName}
            className={`w-12 h-12 rounded-full object-cover ring-2 shrink-0 ${toneConfig.ring}`}
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-full ring-2 shrink-0 flex items-center justify-center font-black text-lg ${toneConfig.fallbackAvatar}`}
          >
            {agent?.firstName?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black text-white">
              {agent ? `${agent.firstName} ${agent.lastName}` : "Unknown Agent"}
            </p>
            {agent?.isVerified && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Verified Agent
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{contact}</p>
        </div>
      </div>
    </div>
  );
}

export function SummaryCard({ rows }: SummaryCardProps) {
  return (
    <div className="w-full bg-white/4 border border-white/7 rounded-2xl p-4 flex flex-col gap-3">
      {rows.map(({ label, value }) => (
        <div
          key={label}
          className="flex items-center justify-between text-sm gap-3"
        >
          <span className="text-gray-500">{label}</span>
          <div className="text-right">{value}</div>
        </div>
      ))}
    </div>
  );
}

export function PaymentStatusScreen({
  icon,
  title,
  description,
  rows,
  footer,
  primaryAction,
  secondaryAction,
}: StatusScreenProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-5 text-white">
      {icon}
      <div className="text-center">
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="text-gray-400 mt-1 text-sm">{description}</p>
      </div>
      <SummaryCard rows={rows} />
      {footer}
      <Button variant="secondary" onClick={primaryAction.onClick}>
        {primaryAction.label}
      </Button>
      {secondaryAction ? (
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
        >
          {secondaryAction.label}
        </button>
      ) : null}
    </div>
  );
}
