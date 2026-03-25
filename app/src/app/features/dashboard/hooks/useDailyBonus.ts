import { useEffect, useRef, useState } from "react";
import { useGameSound } from "../../../../hooks/useSound";
import { fireConfetti } from "../../../../lib/confetti";
import { getErrorMessage } from "../../../../lib/errors";
import { haptic } from "../../../../lib/haptic";
import { useWalletStore } from "../../../../store/wallet.store";
import {
  DAILY_BONUS_COOLDOWN_MS,
  DAILY_BONUS_PRIZES,
  DAILY_BONUS_SEGMENT_ANGLE,
  DAILY_BONUS_STORAGE_KEY,
} from "../dailyBonus.constants";
import { useClaimDailyBonus } from "../../payments";

type DailyBonusPrize = (typeof DAILY_BONUS_PRIZES)[number];

function hasSpunRecently() {
  const last = localStorage.getItem(DAILY_BONUS_STORAGE_KEY);
  return last
    ? Date.now() - new Date(last).getTime() < DAILY_BONUS_COOLDOWN_MS
    : false;
}

function getTimeUntilNext() {
  const last = localStorage.getItem(DAILY_BONUS_STORAGE_KEY);
  if (!last) return "00:00:00";
  const diff =
    new Date(last).getTime() + DAILY_BONUS_COOLDOWN_MS - Date.now();
  if (diff <= 0) return "00:00:00";

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function useDailyBonus() {
  const balance = useWalletStore((s) => s.balance);
  const { mutate: claimBonus } = useClaimDailyBonus();
  const { play } = useGameSound();

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<DailyBonusPrize | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [alreadySpin, setAlreadySpin] = useState(hasSpunRecently);
  const [countdown, setCountdown] = useState(getTimeUntilNext);
  const rotRef = useRef(rotation);
  const spinTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    rotRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (!alreadySpin) return;
    const timer = window.setInterval(() => setCountdown(getTimeUntilNext()), 1000);
    return () => window.clearInterval(timer);
  }, [alreadySpin]);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current !== null) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const spin = () => {
    if (spinning || alreadySpin) return;

    haptic.medium();
    const idx = Math.floor(Math.random() * DAILY_BONUS_PRIZES.length);
    const target =
      360 * 8 +
      (360 - idx * DAILY_BONUS_SEGMENT_ANGLE - DAILY_BONUS_SEGMENT_ANGLE / 2);

    setSpinning(true);
    setPrize(null);
    setRotation(rotRef.current + target);

    spinTimeoutRef.current = window.setTimeout(() => {
      setSpinning(false);
      setPrize(DAILY_BONUS_PRIZES[idx]);
      play("ding");
      haptic.success();
      spinTimeoutRef.current = null;
    }, 4000);
  };

  const claim = () => {
    if (!prize) return;

    play("coin");
    haptic.success();
    claimBonus(undefined, {
      onSuccess: (data: { coins?: number; newBalance?: number }) => {
        const awardedCoins = data.coins ?? prize.coins;
        setPrize((current) => {
          if (!current) return current;
          return {
            ...current,
            coins: awardedCoins as typeof current.coins,
            label: String(awardedCoins) as typeof current.label
          };
        });
        localStorage.setItem(DAILY_BONUS_STORAGE_KEY, new Date().toISOString());
        setClaimed(true);
        setAlreadySpin(true);
        setCountdown(getTimeUntilNext());
        play("win");
        haptic.win();
        fireConfetti();
      },
      onError: (err: unknown) => {
        const msg = getErrorMessage(err, "");
        if (msg.includes("Come back in")) {
          localStorage.setItem(DAILY_BONUS_STORAGE_KEY, new Date().toISOString());
          setPrize(null);
          setAlreadySpin(true);
          setCountdown(getTimeUntilNext());
        }
      },
    });
  };

  return {
    balance,
    claimed,
    countdown,
    alreadySpin,
    prize,
    rotation,
    spinning,
    prizes: DAILY_BONUS_PRIZES,
    claim,
    spin,
  };
}
