import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useUseCode } from "../hooks/useAgents";
import { useRegister } from "../hooks/useAuth";
import { getErrorMessage } from "../lib/errors";
import { toast } from "../store/toast.store";

const schema = z
  .object({
    firstName: z.string().min(2, "Min 2 characters"),
    lastName: z.string().min(2, "Min 2 characters"),
    username: z
      .string()
      .min(3, "Min 3 characters")
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "Min 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must include uppercase, lowercase and a number",
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const { mutate: registerUser, isPending, error } = useRegister();
  const { mutateAsync: applyCode } = useUseCode();
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) =>
    registerUser(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: async () => {
          if (refCode) {
            try {
              await applyCode(refCode);
              toast.success("Referral code applied successfully.");
            } catch (inviteApplyError) {
              const message = getErrorMessage(
                inviteApplyError,
                "Account created, but the referral code could not be applied.",
              );
              toast.warning(message);
            }
          }

          navigate("/onboarding");
        },
      },
    );

  const errMsg = error ? getErrorMessage(error, "Failed to create account") : "";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-5 py-12">
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.3)]">
          <span className="text-3xl">🎱</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Join and start playing</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/[0.04] border border-white/10 rounded-3xl p-6 flex flex-col gap-5">
        {refCode && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span className="text-emerald-400 text-sm">🎁</span>
            <p className="text-xs text-emerald-400 font-semibold">
              Referral code <span className="font-black">{refCode}</span> will
              be applied on signup!
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="John"
              leftIcon={<FiUser />}
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              leftIcon={<FiUser />}
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>
          <Input
            label="Username"
            placeholder="john_doe"
            leftIcon={<FiUser />}
            error={errors.username?.message}
            {...register("username")}
          />
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
          <Input
            label="Confirm Password"
            type={showCpw ? "text" : "password"}
            placeholder="••••••••"
            leftIcon={<FiLock />}
            error={errors.confirmPassword?.message}
            rightIcon={
              <button
                type="button"
                aria-label={
                  showCpw ? "Hide confirm password" : "Show confirm password"
                }
                title={
                  showCpw ? "Hide confirm password" : "Show confirm password"
                }
                onClick={() => setShowCpw(!showCpw)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                {showCpw ? <FiEyeOff /> : <FiEye />}
              </button>
            }
            {...register("confirmPassword")}
          />
          {errMsg && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
              {errMsg}
            </p>
          )}
          <Button type="submit" loading={isPending} size="lg">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Have an account?{" "}
          <Link
            to="/signin"
            className="text-emerald-400 font-semibold hover:text-emerald-300"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
