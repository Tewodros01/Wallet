import type { ReactNode } from "react";
import { FiX } from "react-icons/fi";

interface BottomSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function BottomSheet({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-white/10 bg-gray-950 p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/15" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">{title}</p>
            {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
          >
            <FiX className="text-sm text-white" />
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
