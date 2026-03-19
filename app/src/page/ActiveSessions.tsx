import {
  FiArrowLeft,
  FiMonitor,
  FiShield,
  FiSmartphone,
  FiTablet,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/ui/Layout";
import {
  useRevokeAllSessions,
  useRevokeSession,
  useSessions,
} from "../hooks/useAuth";
import type { Session } from "../types/user.types";

type DeviceType = "mobile" | "desktop" | "tablet";

function guessDevice(userAgent: string | null): DeviceType {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

const deviceBg: Record<DeviceType, string> = {
  mobile: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
  desktop: "bg-blue-500/15 border-blue-500/25 text-blue-400",
  tablet: "bg-violet-500/15 border-violet-500/25 text-violet-400",
};

const DeviceIcon = ({ type }: { type: DeviceType }) => {
  if (type === "mobile") return <FiSmartphone className="text-lg" />;
  if (type === "tablet") return <FiTablet className="text-lg" />;
  return <FiMonitor className="text-lg" />;
};

export default function ActiveSessions() {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading } = useSessions();
  const { mutate: revoke, isPending: revoking } = useRevokeSession();
  const { mutate: revokeAll, isPending: revokingAll } = useRevokeAllSessions();

  const others = sessions.filter((_: Session, i: number) => i > 0); // first = current

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
            <span className="text-base font-black">Active Sessions</span>
          </div>
        }
        right={
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <FiShield className="text-emerald-400 text-sm" />
          </div>
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-10">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-blue-400 text-lg shrink-0">ℹ️</span>
          <p className="text-xs text-gray-400 leading-relaxed">
            These are all devices currently logged into your account. If you
            don't recognize a session, revoke it immediately.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3 flex flex-col items-center gap-1">
            <span className="text-lg font-black text-white">
              {sessions.length}
            </span>
            <span className="text-[9px] text-gray-500 uppercase tracking-wide">
              Total
            </span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl py-3 flex flex-col items-center gap-1">
            <span className="text-lg font-black text-emerald-400">1</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-wide">
              Current
            </span>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl py-3 flex flex-col items-center gap-1">
            <span className="text-lg font-black text-orange-400">
              {others.length}
            </span>
            <span className="text-[9px] text-gray-500 uppercase tracking-wide">
              Other
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-white/[0.04] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {sessions.slice(0, 1).map((s: Session) => {
              const dtype = guessDevice(s.userAgent);
              return (
                <div key={s.id} className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Current Session
                  </p>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${deviceBg[dtype]}`}
                    >
                      <DeviceIcon type={dtype} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white truncate">
                          {s.userAgent ?? "Unknown device"}
                        </p>
                        <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                          THIS DEVICE
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {s.ipAddress ?? "Unknown IP"}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        {new Date(s.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {others.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Other Sessions
                  </p>
                  <button
                    type="button"
                    onClick={() => revokeAll()}
                    disabled={revokingAll}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50"
                  >
                    Revoke All
                  </button>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
                  {others.map((s: Session, i: number) => {
                    const dtype = guessDevice(s.userAgent);
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 px-4 py-3.5 ${i < others.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${deviceBg[dtype]}`}
                        >
                          <DeviceIcon type={dtype} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {s.userAgent ?? "Unknown device"}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {s.ipAddress ?? "Unknown IP"}
                          </p>
                          <p className="text-[11px] text-gray-600">
                            {new Date(s.createdAt).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Revoke session from ${s.userAgent ?? "unknown device"}`}
                          title="Revoke session"
                          onClick={() => revoke(s.id)}
                          disabled={revoking}
                          className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 active:scale-90 transition-all disabled:opacity-50 shrink-0"
                        >
                          {revoking ? (
                            <span className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiX className="text-sm" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {others.length === 0 && sessions.length > 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-gray-600">
                <FiShield className="text-3xl text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-500">
                  Only one active session
                </p>
                <p className="text-xs text-gray-600">Your account is secure</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
