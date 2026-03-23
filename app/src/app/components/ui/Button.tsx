import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "gold" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
}

const variants = {
  primary:   "bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_24px_rgba(16,185,129,0.4)]",
  secondary: "bg-white/10 hover:bg-white/15 text-white border border-white/10",
  danger:    "bg-rose-500 hover:bg-rose-400 text-white",
  gold:      "bg-linear-to-r from-yellow-400 to-orange-500 text-gray-900 font-black shadow-[0_0_24px_rgba(245,158,11,0.4)]",
  ghost:     "bg-transparent hover:bg-white/10 text-gray-400 hover:text-white w-auto",
};

const sizes = {
  sm: "px-3 py-2 text-xs rounded-xl",
  md: "px-5 py-3 text-sm rounded-2xl",
  lg: "px-5 py-4 text-base rounded-2xl",
};

export default function Button({
  loading, children, disabled, variant = "primary",
  size = "md", icon, className = "", ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`w-full flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
          Loading...
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
