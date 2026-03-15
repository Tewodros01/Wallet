import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-gray-400">{label}</label>}
      <input ref={ref} className="input" {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  ),
);

Input.displayName = "Input";
export default Input;
