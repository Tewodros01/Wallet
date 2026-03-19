export const LETTER_COLOR = {
  B: "#f43f5e",
  I: "#f97316",
  N: "#10b981",
  G: "#14b8a6",
  O: "#06b6d4",
} as const;

export const LETTER_TAILWIND = {
  B: "bg-rose-500",
  I: "bg-orange-500",
  N: "bg-emerald-500",
  G: "bg-teal-500",
  O: "bg-cyan-500",
} as const;

export const LETTER_TEXT = {
  B: "text-rose-400",
  I: "text-orange-400",
  N: "text-emerald-400",
  G: "text-teal-400",
  O: "text-cyan-400",
} as const;

export const COLS = ["B", "I", "N", "G", "O"] as const;

export const ALL_NUMBERS = Array.from({ length: 75 }, (_, i) => i + 1);

export const SAMPLE_CARDS = [
  {
    id: 1,
    board: [
      [6, 17, 35, 58, 73],
      [7, 19, 43, 60, 68],
      [4, 29, 0, 59, 70],
      [3, 30, 40, 54, 62],
      [9, 21, 38, 48, 67],
    ],
  },
  {
    id: 2,
    board: [
      [12, 20, 33, 46, 65],
      [5, 28, 44, 57, 72],
      [15, 16, 0, 50, 63],
      [1, 25, 31, 53, 74],
      [10, 22, 42, 49, 61],
    ],
  },
  {
    id: 3,
    board: [
      [8, 18, 36, 47, 66],
      [13, 27, 41, 56, 75],
      [2, 24, 0, 51, 64],
      [11, 26, 34, 55, 69],
      [14, 23, 37, 52, 71],
    ],
  },
  {
    id: 4,
    board: [
      [3, 16, 32, 60, 72],
      [9, 22, 45, 47, 65],
      [15, 30, 0, 53, 68],
      [6, 19, 38, 58, 74],
      [12, 28, 41, 50, 63],
    ],
  },
] as const;

export const getLetter = (n: number) =>
  n <= 15 ? "B" : n <= 30 ? "I" : n <= 45 ? "N" : n <= 60 ? "G" : "O";
