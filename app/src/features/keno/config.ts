export const KENO_MAX_PICK = 10;
export const KENO_TOTAL = 80;
export const KENO_DRAW_SIZE = 20;
export const KENO_BETS = [10, 25, 50, 100, 200, 500] as const;

export const KENO_STYLES = {
  classic: {
    label: "Classic",
    sub: "Balanced picks and standard pace",
    picks: 5,
    bet: 50,
    accent: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  },
  quick: {
    label: "Quick 3",
    sub: "Low-risk, fast rounds",
    picks: 3,
    bet: 25,
    accent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  highRoller: {
    label: "High Roller",
    sub: "More picks, bigger upside",
    picks: 8,
    bet: 100,
    accent: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
} as const;

export type KenoStyle = keyof typeof KENO_STYLES;

export const DEFAULT_KENO_STYLE: KenoStyle = "classic";

export const KENO_PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 3 },
  2: { 2: 12 },
  3: { 2: 2, 3: 40 },
  4: { 2: 1, 3: 5, 4: 100 },
  5: { 3: 3, 4: 20, 5: 500 },
  6: { 3: 2, 4: 8, 5: 100, 6: 1500 },
  7: { 3: 1, 4: 5, 5: 40, 6: 400, 7: 5000 },
  8: { 4: 3, 5: 20, 6: 100, 7: 1000, 8: 10000 },
  9: { 4: 2, 5: 10, 6: 50, 7: 500, 8: 5000, 9: 25000 },
  10: { 5: 5, 6: 20, 7: 100, 8: 1000, 9: 10000, 10: 100000 },
};
