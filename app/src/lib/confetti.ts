import confetti from "canvas-confetti";

export function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.55 },
    colors: ["#10b981", "#f59e0b", "#6366f1", "#ec4899", "#06b6d4"],
  });
}

export function fireSideConfetti() {
  const fire = (x: number, angle: number) =>
    confetti({
      particleCount: 60,
      angle,
      spread: 55,
      origin: { x, y: 0.6 },
      colors: ["#10b981", "#f59e0b", "#6366f1"],
    });
  fire(0, 60);
  fire(1, 120);
}
