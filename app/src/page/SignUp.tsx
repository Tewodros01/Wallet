import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useRegister } from "../hooks/useAuth";

const SignUp = () => {
  const navigate = useNavigate();
  const { mutate: register, isPending, error } = useRegister();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { phone, ...rest } = form;
    register(
      { ...rest, ...(phone ? { phone } : {}) },
      { onSuccess: () => navigate("/dashboard") },
    );
  };

  const errMsg = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
        <p className="text-gray-400 text-sm mb-6">
          Get started with your wallet
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              name="firstName"
              placeholder="John"
              value={form.firstName}
              onChange={onChange}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              placeholder="Doe"
              value={form.lastName}
              onChange={onChange}
              required
            />
          </div>
          <Input
            label="Username"
            name="username"
            placeholder="johndoe"
            value={form.username}
            onChange={onChange}
            required
          />
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
          <Input
            label="Phone (optional)"
            name="phone"
            type="tel"
            placeholder="+1234567890"
            value={form.phone}
            onChange={onChange}
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
