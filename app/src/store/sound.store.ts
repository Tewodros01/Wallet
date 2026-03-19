import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SoundStore {
  muted: boolean;
  toggle: () => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      muted: false,
      toggle: () => set((s) => ({ muted: !s.muted })),
    }),
    { name: "sound-prefs" },
  ),
);
