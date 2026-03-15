import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useLogin } from "../hooks/useAuth";

const SignIn = () => {
  const navigate = useNavigate();
  const { mutate: login, isPending, error } = useLogin();
  const [form, setForm] = useState({ email: "", password: "" });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(form, { onSuccess: () => navigate("/dashboard") });
  };

  const errMsg = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-gray-400 text-sm mb-6">Sign in to your account</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={onChange}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={onChange}
            required
          />

          {errMsg && <p className="text-sm text-red-400">{errMsg}</p>}

          <Button type="submit" loading={isPending}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-violet-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
