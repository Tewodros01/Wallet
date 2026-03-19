import { useState } from "react";
import { FiArrowLeft, FiLock, FiMail } from "react-icons/fi";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { api } from "../lib/axios";

const emailSchema = z.object({ email: z.string().email("Invalid email") });
const resetSchema = z.object({
  token: z.string().min(10, "Invalid token"),
  newPassword: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Must include uppercase, lowercase and a number"),
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
  const [step, setStep]       = useState<"request" | "reset" | "done">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  // In dev the token is returned in the response; in prod it would come via email
  const [devToken, setDevToken] = useState<string | null>(null);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const onRequestReset = async (data: EmailForm) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post("/auth/forgot-password", { email: data.email });
      // resetToken is only returned in dev — remove in production
      if (res.data.resetToken) setDevToken(res.data.resetToken);
      setStep("reset");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: ResetForm) => {
    setLoading(true); setError(null);
    try {
      await api.post("/auth/reset-password", { token: data.token, newPassword: data.newPassword });
      setStep("done");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-5 py-12">
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.3)]">
          <span className="text-3xl">🔐</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">
            {step === "done" ? "Password Reset!" : "Forgot Password"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === "request" && "Enter your email to receive a reset link"}
            {step === "reset"   && "Enter your reset token and new password"}
            {step === "done"    && "Your password has been updated successfully"}
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/[0.04] border border-white/10 rounded-3xl p-6 flex flex-col gap-5">
        {step === "request" && (
          <form onSubmit={emailForm.handleSubmit(onRequestReset)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<FiMail />}
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register("email")}
            />
            {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
            <Button type="submit" loading={loading} size="lg">Send Reset Link</Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="flex flex-col gap-4">
            {devToken && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
                <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wide mb-1">Dev mode — token (remove in production)</p>
                <p className="text-xs text-yellow-300 font-mono break-all">{devToken}</p>
                <button
                  type="button"
                  onClick={() => resetForm.setValue("token", devToken)}
                  className="mt-1.5 text-[10px] text-yellow-400 underline"
                >
                  Auto-fill token
                </button>
              </div>
            )}
            <Input
              label="Reset Token"
              placeholder="Paste your reset token"
              leftIcon={<FiLock />}
              error={resetForm.formState.errors.token?.message}
              {...resetForm.register("token")}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<FiLock />}
              error={resetForm.formState.errors.newPassword?.message}
              {...resetForm.register("newPassword")}
            />
            {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
            <Button type="submit" loading={loading} size="lg">Reset Password</Button>
          </form>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <span className="text-5xl">✅</span>
            <p className="text-sm text-gray-400 text-center">You can now sign in with your new password.</p>
            <Link
              to="/signin"
              className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm text-center active:scale-95 transition-all"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {step !== "done" && (
          <Link to="/signin" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            <FiArrowLeft className="text-xs" /> Back to Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
