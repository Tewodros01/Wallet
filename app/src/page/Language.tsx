import { useState } from "react";
import { FiArrowLeft, FiCheck, FiGlobe, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";

const LANGUAGES = [
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
];

export default function Language() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("en");
  const [search, setSearch] = useState("");

  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.native.toLowerCase().includes(search.toLowerCase()),
  );

  const current = LANGUAGES.find((l) => l.code === selected)!;

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
            <span className="text-base font-black">Language</span>
          </div>
        }
        right={
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <FiGlobe className="text-blue-400 text-sm" />
          </div>
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* Current */}
        <div className="bg-linear-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl">{current.flag}</span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Current Language
            </p>
            <p className="text-sm font-black text-white">{current.name}</p>
            <p className="text-xs text-gray-500">{current.native}</p>
          </div>
          <FiCheck className="text-emerald-400 text-lg" />
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white/6 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-500 transition-all">
          <FiSearch className="text-gray-500 shrink-0" />
          <input
            type="text"
            aria-label="Search language"
            placeholder="Search language..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
          />
        </div>

        {/* List */}
        <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-600">
              <FiGlobe className="text-2xl" />
              <p className="text-sm">No language found</p>
            </div>
          )}
          {filtered.map((lang, i) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelected(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/4 transition-colors text-left ${
                i < filtered.length - 1 ? "border-b border-white/5" : ""
              } ${selected === lang.code ? "bg-emerald-500/5" : ""}`}
            >
              <span className="text-2xl shrink-0">{lang.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{lang.name}</p>
                <p className="text-[11px] text-gray-500">{lang.native}</p>
              </div>
              {selected === lang.code && (
                <FiCheck className="text-emerald-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
