import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

const Button = ({ loading, children, disabled, ...props }: ButtonProps) => (
  <button
    disabled={disabled || loading}
    className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
    {...props}
  >
    {loading ? "Loading..." : children}
  </button>
);

export default Button;
