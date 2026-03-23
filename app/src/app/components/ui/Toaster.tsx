import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiX,
} from "react-icons/fi";
import { useToastStore, type ToastType } from "../../../store/toast.store";

const META: Record<
  ToastType,
  { icon: React.ReactNode; bar: string; bg: string; text: string }
> = {
  success: {
    icon: <FiCheckCircle />,
    bar: "bg-emerald-500",
    bg: "bg-gray-900 border-emerald-500/30",
    text: "text-emerald-400",
  },
  error: {
    icon: <FiAlertCircle />,
    bar: "bg-rose-500",
    bg: "bg-gray-900 border-rose-500/30",
    text: "text-rose-400",
  },
  warning: {
    icon: <FiAlertTriangle />,
    bar: "bg-yellow-500",
    bg: "bg-gray-900 border-yellow-500/30",
    text: "text-yellow-400",
  },
  info: {
    icon: <FiInfo />,
    bar: "bg-blue-500",
    bg: "bg-gray-900 border-blue-500/30",
    text: "text-blue-400",
  },
};

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => {
        const m = META[t.type];
        return (
          <div
            key={t.id}
            className={`w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl pointer-events-auto animate-in slide-in-from-top-2 duration-200 ${m.bg}`}
          >
            <div className={`w-1 h-8 rounded-full shrink-0 ${m.bar}`} />
            <span className={`text-base shrink-0 ${m.text}`}>{m.icon}</span>
            <p className="flex-1 text-sm font-semibold text-white leading-snug">
              {t.message}
            </p>
            <button
              type="button"
              aria-label="Dismiss notification"
              title="Dismiss notification"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-gray-500 hover:text-white transition-colors"
            >
              <FiX className="text-sm" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
