import { useState } from "react";
import { FiArrowRight, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../../../api/users.api";
import { APP_ROUTES } from "../../../config/routes";
import { useAuthStore } from "../../../store/auth.store";

const SLIDES = [
  {
    emoji: "🎱",
    title: "Play Bingo & Keno",
    body: "Join live rooms, pick your cards, and compete with hundreds of players for real coin prizes.",
    bg: "from-emerald-600/30 to-teal-600/10",
    accent: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  {
    emoji: "🏆",
    title: "Win Big Every Day",
    body: "Climb the leaderboard, complete daily missions, and enter tournaments to win massive prize pools.",
    bg: "from-yellow-600/30 to-orange-600/10",
    accent: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  {
    emoji: "💰",
    title: "Cash Out Anytime",
    body: "Deposit and withdraw easily via Telebirr or CBE Birr. Your coins, your money, your rules.",
    bg: "from-violet-600/30 to-purple-600/10",
    accent: "text-violet-400",
    dot: "bg-violet-400",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const finish = async () => {
    try {
      const updated = await usersApi.completeOnboarding();
      setUser(updated);
    } catch {
      // Keep the user on the server-authoritative onboarding state if this fails.
    }
    navigate(APP_ROUTES.dashboard, { replace: true });
  };

  const next = () => {
    if (isLast) finish();
    else setIdx((i) => i + 1);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Skip */}
      <div className="flex justify-end px-5 pt-5">
        <button
          type="button"
          onClick={finish}
          className="text-xs text-gray-500 font-semibold hover:text-gray-300 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
        {/* Illustration */}
        <div
          className={`w-48 h-48 rounded-3xl bg-linear-to-br ${slide.bg} border border-white/8 flex items-center justify-center`}
          style={{ boxShadow: "0 0 80px rgba(16,185,129,0.1)" }}
        >
          <span className="text-8xl">{slide.emoji}</span>
        </div>

        {/* Text */}
        <div className="text-center flex flex-col gap-3">
          <h1 className="text-3xl font-black text-white leading-tight">
            {slide.title}
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
            {slide.body}
          </p>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              title={`Go to slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${i === idx ? `w-6 h-2.5 ${slide.dot}` : "w-2.5 h-2.5 bg-white/20"}`}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={next}
          className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 active:scale-95 transition-all text-base bg-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.4)]"
        >
          {isLast ? (
            <>
              <FiZap className="text-lg" /> Let's Play!
            </>
          ) : (
            <>
              Next <FiArrowRight className="text-lg" />
            </>
          )}
        </button>
        {!isLast && (
          <button
            type="button"
            onClick={finish}
            className="text-center text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            I'll explore on my own
          </button>
        )}
      </div>
    </div>
  );
}
