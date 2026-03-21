import { useEffect, useState } from "react";

export function useTournamentCountdown(target: string) {
  const calc = () =>
    Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000));
  const [secs, setSecs] = useState(calc);

  useEffect(() => {
    const timer = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (secs === 0) return "Starting…";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h > 0 ? `${h}h ` : ""}${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}
