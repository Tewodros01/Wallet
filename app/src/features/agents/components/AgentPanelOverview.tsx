import type { AgentTab, AgentTabConfig } from "../constants";

type StatCard = {
  label: string;
  value: number;
  color: string;
  bg: string;
};

interface AgentSummaryStatsProps {
  stats: StatCard[];
}

export function AgentSummaryStats({ stats }: AgentSummaryStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(({ label, value, color, bg }) => (
        <div
          key={label}
          className={`${bg} flex flex-col items-center gap-1 rounded-2xl border py-3`}
        >
          <span className={`text-base font-black ${color}`}>{value}</span>
          <span className="text-[9px] uppercase tracking-wide text-gray-500">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

interface AgentPanelTabsProps {
  tabs: AgentTabConfig[];
  activeTab: AgentTab;
  onChange: (tab: AgentTab) => void;
}

export function AgentPanelTabs({
  tabs,
  activeTab,
  onChange,
}: AgentPanelTabsProps) {
  return (
    <div className="flex gap-1.5 rounded-2xl border border-white/7 bg-white/4 p-1.5">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={activeTab === id}
          className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold transition-all ${
            activeTab === id
              ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <span className="text-sm">
            <Icon />
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}
