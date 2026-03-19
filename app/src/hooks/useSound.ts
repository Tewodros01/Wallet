// Thin wrapper — plays sounds only if user hasn't muted
import { useCallback } from "react";
import { useSoundStore } from "../store/sound.store";

const cache: Record<string, HTMLAudioElement> = {};

function getAudio(src: string): HTMLAudioElement {
  if (!cache[src]) {
    cache[src] = new Audio(src);
    cache[src].volume = 0.5;
  }
  return cache[src];
}

export function useGameSound() {
  const muted = useSoundStore((s) => s.muted);

  const play = useCallback(
    (name: "click" | "coin" | "pop" | "ding" | "win" | "error") => {
      if (muted) return;
      try {
        const audio = getAudio(`/sounds/${name}.wav`);
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch {}
    },
    [muted],
  );

  return { play };
}
