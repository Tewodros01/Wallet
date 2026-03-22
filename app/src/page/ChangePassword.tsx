import { useId, useState } from "react";
import { FiArrowLeft, FiCheck, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { AppBar } from "../components/ui/Layout";
import { useChangePassword } from "../hooks/useAuth";
import { getErrorMessage } from "../lib/errors";

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  const inputId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-[11px] font-bold uppercase tracking-widest text-gray-500"
      >
        {label}
      </label>
      <div className="flex items-center gap-3 bg-white/6 border border-white/10 rounded-2xl px-4 py-3.5 focus-within:border-emerald-500 transition-all">
        <FiLock className="text-gray-500 shrink-0" />
        <input
          id={inputId}
          aria-label={label}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          title={show ? "Hide password" : "Show password"}
          onClick={() => setShow(!show)}
          className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"
        >
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );
}

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "",
    "bg-rose-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-emerald-500",
  ];
  const textColors = [
    "",
    "text-rose-400",
    "text-orange-400",
    "text-yellow-400",
    "text-emerald-400",
  ];
  if (!password) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all ${i <= score ? colors[score] : "bg-white/10"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          {[
            { label: "At least 8 characters", ok: checks[0] },
            { label: "Uppercase letter", ok: checks[1] },
            { label: "Number", ok: checks[2] },
            { label: "Special character", ok: checks[3] },
          ].map(({ label, ok }) => (
            <div key={label} className="flex items-center gap-1.5">
              <FiCheck
                className={`text-[10px] ${ok ? "text-emerald-400" : "text-gray-600"}`}
              />
              <span
                className={`text-[10px] ${ok ? "text-gray-400" : "text-gray-600"}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <span className={`text-xs font-black ${textColors[score]}`}>
          {labels[score]}
        </span>
      </div>
    </div>
  );
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const { mutate: changePassword, isPending } = useChangePassword();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const mismatch = confirm.length > 0 && newPass !== confirm;
  const canSubmit =
    current.length > 0 && newPass.length >= 8 && newPass === confirm;

  const handleSave = () => {
    if (!canSubmit) return;
    setError("");
    changePassword(
      { currentPassword: current, newPassword: newPass },
      {
        onSuccess: () => setSuccess(true),
        onError: (err: unknown) =>
          setError(getErrorMessage(err, "Failed to change password")),
      },
    );
  };

  if (success)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-5 text-white">
        <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          <FiCheck className="text-emerald-400 text-4xl" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black">Password Changed!</h2>
          <p className="text-gray-400 mt-1 text-sm">
            Your password has been updated. Please sign in again.
          </p>
        </div>
        <Button onClick={() => navigate("/settings")}>Back to Settings</Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <span className="text-base font-black">Change Password</span>
          </div>
        }
        right={
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
            <FiLock className="text-rose-400 text-sm" />
          </div>
        }
      />
      <div className="flex flex-col gap-5 px-5 py-6">
        <PasswordInput
          label="Current Password"
          value={current}
          onChange={setCurrent}
          placeholder="Enter current password"
        />
        <div className="h-px bg-white/6" />
        <PasswordInput
          label="New Password"
          value={newPass}
          onChange={setNewPass}
          placeholder="Enter new password"
        />
        <StrengthBar password={newPass} />
        <PasswordInput
          label="Confirm New Password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Re-enter new password"
        />
        {mismatch && (
          <p className="text-xs text-rose-400 -mt-2">Passwords do not match</p>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold">
            {error}
          </div>
        )}
        <Button
          loading={isPending}
          disabled={!canSubmit}
          icon={<FiLock />}
          onClick={handleSave}
        >
          Update Password
        </Button>
      </div>
    </div>
  );
}
