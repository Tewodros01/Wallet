import type { CSSProperties, ReactNode } from "react";
import { FaCoins } from "react-icons/fa";
import { FiGrid, FiHome, FiUser, FiUsers, FiZap } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { haptic } from "../../lib/haptic";

interface AvatarProps {
  src: string;
  name: string;
  coins: string;
  ring?: string;
}

export const Avatar = ({
  src,
  name,
  coins,
  ring = "ring-emerald-400",
}: AvatarProps) => (
  <div className="flex items-center gap-3">
    <img
      src={src}
      alt={name}
      className={`w-10 h-10 rounded-full object-cover ring-2 ${ring} shrink-0`}
    />
    <div className="flex flex-col">
      <span className="text-sm font-bold text-white leading-tight">{name}</span>
      <span className="flex items-center gap-1 mt-0.5">
        <FaCoins className="text-yellow-400 text-[10px]" />
        <span className="text-yellow-300 text-[11px] font-semibold">
          {coins}
        </span>
      </span>
    </div>
  </div>
);

interface PillProps {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}
export const Pill = ({ icon, children, className = "" }: PillProps) => (
  <div
    className={`flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold text-white shrink-0 ${className}`}
  >
    {icon && <span className="text-xs">{icon}</span>}
    {children}
  </div>
);

interface AppBarProps {
  left: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
  style?: CSSProperties;
}
export const AppBar = ({
  left,
  center,
  right,
  className = "",
  style,
}: AppBarProps) => (
  <div
    className={`flex items-center justify-between px-5 py-3.5 bg-gray-950/95 border-b border-white/7 backdrop-blur-xl sticky top-0 z-40 ${className}`}
    style={style}
  >
    {left}
    {center && (
      <div className="absolute left-1/2 -translate-x-1/2">{center}</div>
    )}
    {right && <div className="flex items-center gap-2">{right}</div>}
  </div>
);

export const Divider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 h-px bg-white/10" />
    <span className="text-xs text-gray-500 shrink-0">{label}</span>
    <div className="flex-1 h-px bg-white/10" />
  </div>
);

export const SocialBtn = ({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) => (
  <button
    type="button"
    aria-label={label}
    className="flex-1 h-12 rounded-2xl bg-white/6 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
  >
    <span className="text-gray-300 text-lg">{icon}</span>
  </button>
);

const NAV_ITEMS = [
  { path: "/dashboard", label: "Home", Icon: FiHome },
  { path: "/game", label: "Bingo", Icon: FiUsers },
  { path: "/keno", label: "Keno", Icon: FiZap },
  { path: "/wallet", label: "Wallet", Icon: FiGrid },
  { path: "/profile", label: "Profile", Icon: FiUser },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-2 pointer-events-none">
      <div className="pointer-events-auto flex items-center bg-gray-900/90 backdrop-blur-2xl border border-white/8 rounded-3xl px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const active =
            pathname === path ||
            (path === "/game" && pathname.startsWith("/game")) ||
            (path === "/keno" && pathname.startsWith("/keno"));
          return (
            <button
              key={path}
              type="button"
              onClick={() => {
                haptic.light();
                navigate(path);
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-90"
            >
              <div
                className={`w-11 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  active
                    ? "bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.5)]"
                    : "bg-transparent"
                }`}
              >
                <Icon
                  className={`text-base transition-colors duration-200 ${
                    active ? "text-white" : "text-gray-500"
                  }`}
                />
              </div>
              <span
                className={`text-[9px] font-bold tracking-wide transition-colors duration-200 ${
                  active ? "text-emerald-400" : "text-gray-600"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
