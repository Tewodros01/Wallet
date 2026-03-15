import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useRegister } from "../hooks/useAuth";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  username: z.string().min(3, "At least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SignUp = () => {
  const navigate = useNavigate();
  const { mutate: register, isPending, error } = useRegister();

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) =>
    register(
      { ...data, phone: data.phone || undefined },
      { onSuccess: () => navigate("/dashboard") },
    );

  const errMsg = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
        <p className="text-gray-400 text-sm mb-6">
          Get started with your wallet
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="John"
              error={errors.firstName?.message}
              {...field("firstName")}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.lastName?.message}
              {...field("lastName")}
            />
          </div>
          <Input
            label="Username"
            placeholder="johndoe"
            error={errors.username?.message}
            {...field("username")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...field("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...field("password")}
          />
          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="+1234567890"
            error={errors.phone?.message}
            {...field("phone")}
          />

          {errMsg && <p className="text-sm text-red-400">{errMsg}</p>}

          <Button type="submit" loading={isPending}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/signin" className="text-violet-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
