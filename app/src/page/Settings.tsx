import { useState } from "react";
import {
  FiBell,
  FiChevronRight,
  FiGlobe,
  FiLock,
  FiLogOut,
  FiMoon,
  FiSettings,
  FiShield,
  FiUser,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar, BottomNav } from "../components/ui/Layout";
import { useAuthStore } from "../store/auth.store";
import { useSoundStore } from "../store/sound.store";
import type { SettingsSection } from "../types/settings.types";

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={on ? "Turn off" : "Turn on"}
    title={on ? "Turn off" : "Turn on"}
    className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${on ? "bg-emerald-500" : "bg-white/15"}`}
  >
    <span
      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
    />
  </button>
);

export default function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const handleSignOut = () => {
    clear();
    navigate("/signin", { replace: true });
  };
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const { muted, toggle: toggleSound } = useSoundStore();

  const sections: SettingsSection[] = [
    {
      title: "Account",
      items: [
        {
          icon: <FiUser />,
          label: "Edit Profile",
          sub: "Name, avatar, username",
          action: () => navigate("/edit-profile"),
          chevron: true,
        },
        {
          icon: <FiLock />,
          label: "Change Password",
          sub: "Update your password",
          action: () => navigate("/change-password"),
          chevron: true,
        },
        {
          icon: <FiGlobe />,
          label: "Language",
          sub: "English",
          action: () => navigate("/language"),
          chevron: true,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: <FiBell />,
          label: "Notifications",
          sub: "Game alerts & updates",
          toggle: true,
          value: notifications,
          onToggle: () => setNotifications(!notifications),
        },
        {
          icon: muted ? <FiVolumeX className="text-rose-400" /> : <FiVolume2 />,
          label: "Sound Effects",
          sub: muted ? "Muted" : "On — tap to mute",
          toggle: true,
          value: !muted,
          onToggle: toggleSound,
        },
        {
          icon: <FiMoon />,
          label: "Dark Mode",
          sub: "Always on",
          toggle: true,
          value: darkMode,
          onToggle: () => setDarkMode(!darkMode),
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          icon: <FiShield />,
          label: "Two-Factor Auth",
          sub: "Extra account security",
          toggle: true,
          value: twoFactor,
          onToggle: () => setTwoFactor(!twoFactor),
        },
        {
          icon: <FiLock />,
          label: "Active Sessions",
          sub: "Manage devices",
          action: () => navigate("/active-sessions"),
          chevron: true,
        },
      ],
    },
    ...(user?.role === "ADMIN"
      ? [
          {
            title: "Admin",
            items: [
              {
                icon: <FiShield />,
                label: "Admin Panel",
                sub: "Stats, deposits, withdrawals & agents",
                action: () => navigate("/admin/panel"),
                chevron: true,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gray-500/15 border border-gray-500/25 flex items-center justify-center">
              <FiSettings className="text-gray-400 text-sm" />
            </div>
            <span className="text-base font-black">Settings</span>
          </div>
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-28">
        {/* Profile card */}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.07] transition-colors active:scale-[0.98] text-left"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/40 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/40 shrink-0 flex items-center justify-center text-emerald-400 font-black text-lg">
              {user?.firstName?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">
              {user ? `${user.firstName} ${user.lastName}` : "—"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email ?? "—"}
            </p>
          </div>
          <FiChevronRight className="text-gray-600 shrink-0" />
        </button>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {section.title}
            </p>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
              {section.items.map((item, i) => {
                const base = `w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${i < section.items.length - 1 ? "border-b border-white/[0.05]" : ""}`;
                if (item.toggle) {
                  return (
                    <div
                      key={item.label}
                      className={`${base} hover:bg-white/[0.04]`}
                    >
                      <span className="text-gray-400 text-sm shrink-0">
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {item.label}
                        </p>
                        {item.sub && (
                          <p className="text-[11px] text-gray-500">
                            {item.sub}
                          </p>
                        )}
                      </div>
                      <Toggle on={item.value!} onToggle={item.onToggle!} />
                    </div>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className={`${base} hover:bg-white/[0.04]`}
                  >
                    <span className="text-gray-400 text-sm shrink-0">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {item.label}
                      </p>
                      {item.sub && (
                        <p className="text-[11px] text-gray-500">{item.sub}</p>
                      )}
                    </div>
                    <FiChevronRight className="text-gray-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full bg-rose-500/10 border border-rose-500/20 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-rose-400 font-bold text-sm hover:bg-rose-500/15 transition-colors active:scale-[0.98]"
        >
          <FiLogOut />
          Sign Out
        </button>

        <p className="text-center text-[11px] text-gray-600">
          Version 1.0.0 · Bingo Game
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
