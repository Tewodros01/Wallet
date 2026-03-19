// ─── Settings Types ──────────────────────────────────────────────────────────

export interface SettingsItem {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  action?: () => void;
  chevron?: boolean;
  toggle?: boolean;
  value?: boolean;
  onToggle?: () => void;
}

export interface SettingsSection {
  title: string;
  items: SettingsItem[];
}