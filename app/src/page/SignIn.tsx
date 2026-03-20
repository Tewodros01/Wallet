import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaTelegramPlane } from "react-icons/fa";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { APP_ROUTES } from "../config/routes";
import { useLogin, useTelegramLogin } from "../hooks/useAuth";
import { getErrorMessage } from "../lib/errors";
import {
  getTelegramInitData,
  getTelegramUser,
  isTelegramMiniApp,
  prepareTelegramWebApp,
} from "../lib/telegram";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function SignIn() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mutate: login, isPending, error } = useLogin();
  const {
    mutate: telegramLogin,
    isPending: isTelegramPending,
    error: telegramError,
  } = useTelegramLogin();
  const [showPw, setShowPw] = useState(false);
  const redirectTo =
    (location.state as { from?: string } | null)?.from || APP_ROUTES.dashboard;
  const telegramUser = getTelegramUser();
  const canUseTelegram = isTelegramMiniApp() && Boolean(getTelegramInitData());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) =>
    login(data, { onSuccess: () => navigate(redirectTo, { replace: true }) });

  const onTelegramSignIn = () => {
    prepareTelegramWebApp();
    const initData = getTelegramInitData();
    if (!initData) return;

    telegramLogin(initData, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
    });
  };

  const errMsg = error ? getErrorMessage(error, "Failed to sign in") : "";
  const telegramErrMsg = telegramError
    ? getErrorMessage(telegramError, "Failed to sign in with Telegram")
    : "";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-5 py-12">
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.3)]">
          <span className="text-3xl">🎱</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/[0.04] border border-white/10 rounded-3xl p-6 flex flex-col gap-5">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {canUseTelegram && (
            <>
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                {telegramUser?.first_name ? (
                  <span>
                    Continue as <span className="font-bold">{telegramUser.first_name}</span> using your Telegram Mini App session.
                  </span>
                ) : (
                  <span>Sign in instantly with your Telegram Mini App session.</span>
                )}
              </div>
              <Button
                type="button"
                size="lg"
                onClick={onTelegramSignIn}
                loading={isTelegramPending}
                className="bg-[#229ED9] hover:bg-[#1d8fc4] shadow-[0_0_24px_rgba(34,158,217,0.35)]"
                icon={<FaTelegramPlane />}
              >
                Continue with Telegram
              </Button>
              {telegramErrMsg && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                  {telegramErrMsg}
                </p>
              )}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0b1120] px-3 text-xs uppercase tracking-[0.25em] text-gray-500">
                    or
                  </span>
                </div>
              </div>
            </>
          )}
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<FiMail />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            leftIcon={<FiLock />}
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                aria-label={showPw ? "Hide password" : "Show password"}
                title={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw(!showPw)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                {showPw ? <FiEyeOff /> : <FiEye />}
              </button>
            }
            {...register("password")}
          />
          {errMsg && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
              {errMsg}
            </p>
          )}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-gray-500 hover:text-emerald-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" loading={isPending} size="lg">
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          No account?{" "}
          <Link
            to="/signup"
            className="text-emerald-400 font-semibold hover:text-emerald-300"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
