import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-bold uppercase tracking-widest text-gray-500"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-gray-500 text-sm pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-label={props["aria-label"] ?? label}
            className={`w-full bg-white/[0.06] text-white placeholder-gray-600 border border-white/10 rounded-2xl py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white/[0.09] transition-all ${leftIcon ? "pl-10" : "pl-4"} ${rightIcon ? "pr-10" : "pr-4"} ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3.5 text-gray-500 text-sm">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
