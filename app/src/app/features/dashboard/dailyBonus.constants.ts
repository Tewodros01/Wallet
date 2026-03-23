export const DAILY_BONUS_PRIZES = [
  { label: "50", coins: 50, color: "#10b981", bg: "#064e3b" },
  { label: "200", coins: 200, color: "#f59e0b", bg: "#451a03" },
  { label: "100", coins: 100, color: "#6366f1", bg: "#1e1b4b" },
  { label: "500", coins: 500, color: "#ec4899", bg: "#500724" },
  { label: "75", coins: 75, color: "#14b8a6", bg: "#042f2e" },
  { label: "1000", coins: 1000, color: "#f97316", bg: "#431407" },
  { label: "25", coins: 25, color: "#8b5cf6", bg: "#2e1065" },
  { label: "300", coins: 300, color: "#06b6d4", bg: "#083344" },
] as const;

export const DAILY_BONUS_STORAGE_KEY = "daily_bonus_last_spin";
export const DAILY_BONUS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const DAILY_BONUS_SEGMENT_ANGLE = 360 / DAILY_BONUS_PRIZES.length;
