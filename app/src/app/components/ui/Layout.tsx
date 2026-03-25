import type { CSSProperties, ReactNode } from "react";
import { FaCoins } from "react-icons/fa";
import { FiGrid, FiHome, FiUser, FiUsers, FiZap } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { haptic } from "../../../lib/haptic";
import { getAvatarInitials, getPublicAssetUrl } from "../../../lib/assets";
import { useTheme } from "../../../hooks/useTheme";
import { getThemeClasses } from "../../../lib/theme";

interface AvatarProps {
  src?: string | null;
  name: string;
  coins: string;
  ring?: string;
}

export const Avatar = ({
  src,
  name,
  coins,
  ring = "ring-emerald-400",
}: AvatarProps) => {
  const avatarSrc = getPublicAssetUrl(src);
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);

  return (
    <div className="flex items-center gap-3">
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={name}
          className={`w-10 h-10 rounded-full object-cover ring-2 ${ring} shrink-0`}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`w-10 h-10 rounded-full ring-2 ${ring} shrink-0 flex items-center justify-center ${isDark ? 'bg-white/8 text-white' : 'bg-slate-100 text-slate-800'} text-sm font-black`}
        >
          {getAvatarInitials(name.split(" ")[0], name.split(" ").slice(1).join(" "), "?")}
        </div>
      )}
      <div className="flex flex-col">
        <span className={`text-sm font-bold ${theme.textPrimary} leading-tight`}>{name}</span>
        <span className="flex items-center gap-1 mt-0.5">
          <FaCoins className="text-yellow-400 text-[10px]" />
          <span className="text-yellow-500 text-[11px] font-semibold">
            {coins}
          </span>
        </span>
      </div>
    </div>
  );
};

interface PillProps {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}
export const Pill = ({ icon, children, className = "" }: PillProps) => {
  const { isDark } = useTheme();
  
  return (
    <div
      className={`flex items-center gap-1.5 ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'} border rounded-full px-3 py-1.5 text-xs font-semibold shrink-0 ${className}`}
    >
      {icon && <span className="text-xs">{icon}</span>}
      {children}
    </div>
  );
};

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
}: AppBarProps) => {
  const { isDark } = useTheme();
  
  return (
    <div
      className={`flex items-center justify-between px-5 py-3.5 ${isDark ? 'bg-gray-950/95 border-white/7' : 'bg-white/95 border-slate-200'} border-b backdrop-blur-xl sticky top-0 z-40 ${className}`}
      style={style}
    >
      {left}
      {center && (
        <div className="absolute left-1/2 -translate-x-1/2">{center}</div>
      )}
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
};

export const Divider = ({ label }: { label: string }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
      <span className={`text-xs ${theme.textMuted} shrink-0`}>{label}</span>
      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
    </div>
  );
};

export const SocialBtn = ({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) => {
  const { isDark } = useTheme();
  
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex-1 h-12 rounded-2xl ${isDark ? 'bg-white/6 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'} border flex items-center justify-center transition-colors`}
    >
      <span className={`${isDark ? 'text-gray-300' : 'text-slate-600'} text-lg`}>{icon}</span>
    </button>
  );
};

const NAV_ITEMS = [
  { path: APP_ROUTES.dashboard, label: "Home", Icon: FiHome },
  { path: APP_ROUTES.game, label: "Bingo", Icon: FiUsers },
  { path: APP_ROUTES.keno, label: "Keno", Icon: FiZap },
  { path: APP_ROUTES.wallet, label: "Wallet", Icon: FiGrid },
  { path: APP_ROUTES.profile, label: "Profile", Icon: FiUser },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-2 pointer-events-none">
      <div className={`pointer-events-auto flex items-center ${isDark ? 'bg-gray-900/90 border-white/8' : 'bg-white/90 border-slate-200'} backdrop-blur-2xl border rounded-3xl px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]`}>
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const active =
            pathname === path ||
            (path === APP_ROUTES.game &&
              pathname.startsWith(APP_ROUTES.game)) ||
            (path === APP_ROUTES.keno &&
              pathname.startsWith(APP_ROUTES.keno));
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
                    active ? "text-white" : (isDark ? "text-gray-500" : "text-slate-400")
                  }`}
                />
              </div>
              <span
                className={`text-[9px] font-bold tracking-wide transition-colors duration-200 ${
                  active ? "text-emerald-400" : (isDark ? "text-gray-600" : "text-slate-500")
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
