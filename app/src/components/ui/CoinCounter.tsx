import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GiCoins } from "react-icons/gi";

interface Props {
  value: number;
  className?: string;
}

export default function CoinCounter({ value, className = "" }: Props) {
  const prevRef  = useRef(value);
  const [display, setDisplay] = useState(value);
  const [delta,   setDelta]   = useState<number | null>(null);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;
    const diff = value - prev;
    prevRef.current = value;

    // Show floating delta
    setDelta(diff);
    const t = setTimeout(() => setDelta(null), 1400);

    // Animate counter
    const start = prev;
    const end   = value;
    const dur   = 600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - startTime) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return (
    <div className={`relative flex items-center gap-1.5 ${className}`}>
      <GiCoins className="text-yellow-400 text-sm shrink-0" />
      <span className="text-yellow-300 text-xs font-black">{display.toLocaleString()}</span>
      <AnimatePresence>
        {delta !== null && (
          <motion.span
            key={delta + Date.now()}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -24 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-black pointer-events-none whitespace-nowrap ${delta > 0 ? "text-emerald-400" : "text-rose-400"}`}
          >
            {delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
