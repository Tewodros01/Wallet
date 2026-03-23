import { create } from "zustand";
import { persist } from "zustand/middleware";

export const LANGUAGE_OPTIONS = [
  { code: "en", name: "English", native: "English", flag: "🇺🇸" },
  { code: "am", name: "Amharic", native: "አማርኛ", flag: "🇪🇹" },
  { code: "om", name: "Oromo", native: "Afaan Oromoo", flag: "🇪🇹" },
  { code: "ti", name: "Tigrinya", native: "ትግርኛ", flag: "🇪🇹" },
  { code: "so", name: "Somali", native: "Soomaali", flag: "🇸🇴" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪" },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇧🇷" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
] as const;

export type AppLanguage = (typeof LANGUAGE_OPTIONS)[number]["code"];

interface PreferencesState {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  twoFactorEnabled: boolean;
  language: AppLanguage;
  setNotificationsEnabled: (enabled: boolean) => void;
  setDarkModeEnabled: (enabled: boolean) => void;
  setTwoFactorEnabled: (enabled: boolean) => void;
  setLanguage: (language: AppLanguage) => void;
}

export const getLanguageMeta = (language: AppLanguage) =>
  LANGUAGE_OPTIONS.find((item) => item.code === language) ?? LANGUAGE_OPTIONS[0];

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      darkModeEnabled: true,
      twoFactorEnabled: false,
      language: "en",
      setNotificationsEnabled: (enabled) =>
        set({ notificationsEnabled: enabled }),
      setDarkModeEnabled: (enabled) => set({ darkModeEnabled: enabled }),
      setTwoFactorEnabled: (enabled) => set({ twoFactorEnabled: enabled }),
      setLanguage: (language) => set({ language }),
    }),
    { name: "app-preferences" },
  ),
);
