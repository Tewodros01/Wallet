import { useState } from "react";
import { FaCoins, FaGamepad, FaLock, FaUnlock } from "react-icons/fa";
import { FiCheck, FiCopy, FiShare2, FiUsers, FiX } from "react-icons/fi";
import { MdTimer } from "react-icons/md";
import { useCreateRoom } from "../hooks/useRooms";
import { getErrorMessage } from "../lib/errors";
import { GameSpeed } from "../types/enums";
import type { GameRoomDetail } from "../types/game.types";
import Button from "./ui/Button";

type Props = { onClose: () => void; onEnter?: (roomId: string) => void };

type Step = "settings" | "created";

const ENTRY_FEES = ["Free", "50", "100", "200", "500", "1000"];
const MAX_PLAYERS = ["10", "20", "50", "100", "200"];
const CARD_LIMITS = ["1", "2", "3", "5"];
const CALL_SPEEDS: { label: string; sub: string; value: GameSpeed }[] = [
  { label: "Slow", sub: "6s", value: GameSpeed.SLOW },
  { label: "Normal", sub: "4s", value: GameSpeed.NORMAL },
  { label: "Fast", sub: "2s", value: GameSpeed.FAST },
];

function OptionPill({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-0.5 ${
        selected
          ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
          : "bg-white/[0.05] text-gray-400 border-white/10 hover:bg-white/10"
      }`}
    >
      {label}
      {sub && (
        <span
          className={`text-[9px] font-normal ${selected ? "text-emerald-100" : "text-gray-600"}`}
        >
          {sub}
        </span>
      )}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
      {children}
    </p>
  );
}

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

export default function CreateRoomModal({ onClose, onEnter }: Props) {
  const { mutate: createRoom, isPending } = useCreateRoom();

  const [step, setStep] = useState<Step>("settings");
  const [roomName, setRoomName] = useState("");
  const [entryFee, setEntryFee] = useState("100");
  const [maxPlayers, setMaxPlayers] = useState("50");
  const [cardLimit, setCardLimit] = useState("2");
  const [callSpeed, setCallSpeed] = useState<GameSpeed>(GameSpeed.NORMAL);
  const [isPrivate, setIsPrivate] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entryFeeNum = entryFee === "Free" ? 0 : Number(entryFee);
  const prize = entryFeeNum * Number(maxPlayers);
  const roomLink = createdId
    ? `${window.location.origin}/game?room=${createdId}`
    : "";

  const handleCreate = () => {
    setError(null);
    createRoom(
      {
        name:
          roomName || `Room ${Date.now().toString(36).toUpperCase().slice(-4)}`,
        speed: callSpeed,
        entryFee: entryFeeNum,
        maxPlayers: Number(maxPlayers),
        cardsPerPlayer: Number(cardLimit),
        isPrivate,
      },
      {
        onSuccess: (data: GameRoomDetail) => {
          setCreatedId(data.id);
          setStep("created");
        },
        onError: (err: unknown) => {
          setError(getErrorMessage(err, "Failed to create room"));
        },
      },
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-t-3xl flex flex-col max-h-[92vh]">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <div>
            <h2 className="text-lg font-black text-white">
              {step === "settings" ? "Create Room" : "Room Created! 🎉"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {step === "settings"
                ? "Configure your bingo room"
                : "Share and wait for players"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            title="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <FiX className="text-gray-400 text-sm" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5">
          {step === "settings" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <SectionLabel>Room Name (optional)</SectionLabel>
                <input
                  type="text"
                  aria-label="Room name"
                  placeholder="e.g. Friday Night Bingo"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={50}
                  className="w-full bg-white/[0.06] text-white placeholder-gray-600 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <SectionLabel>Entry Fee (coins)</SectionLabel>
                <div className="flex gap-1.5">
                  {ENTRY_FEES.map((f) => (
                    <OptionPill
                      key={f}
                      label={f}
                      selected={entryFee === f}
                      onClick={() => setEntryFee(f)}
                    />
                  ))}
                </div>
                {entryFee !== "Free" && (
                  <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
                    <span className="text-xs text-gray-400">
                      Est. Prize Pool
                    </span>
                    <span className="flex items-center gap-1 text-sm font-black text-yellow-300">
                      <FaCoins className="text-xs" />
                      {prize.toLocaleString()} coins
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <SectionLabel>Max Players</SectionLabel>
                <div className="flex gap-1.5">
                  {MAX_PLAYERS.map((p) => (
                    <OptionPill
                      key={p}
                      label={p}
                      selected={maxPlayers === p}
                      onClick={() => setMaxPlayers(p)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionLabel>Cards Per Player</SectionLabel>
                <div className="flex gap-1.5">
                  {CARD_LIMITS.map((c) => (
                    <OptionPill
                      key={c}
                      label={c}
                      sub={c === "1" ? "Basic" : c === "5" ? "Max" : ""}
                      selected={cardLimit === c}
                      onClick={() => setCardLimit(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionLabel>Number Call Speed</SectionLabel>
                <div className="flex gap-1.5">
                  {CALL_SPEEDS.map(({ label, sub, value }) => (
                    <OptionPill
                      key={value}
                      label={label}
                      sub={sub}
                      selected={callSpeed === value}
                      onClick={() => setCallSpeed(value)}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
                {[
                  {
                    icon: isPrivate ? (
                      <FaLock className="text-orange-400" />
                    ) : (
                      <FaUnlock className="text-emerald-400" />
                    ),
                    label: "Private Room",
                    sub: isPrivate
                      ? "Only invited players can join"
                      : "Anyone can browse and join",
                    on: isPrivate,
                    toggle: () => setIsPrivate(!isPrivate),
                  },
                ].map(({ icon, label, sub, on, toggle }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 px-4 py-3.5"
                  >
                    <span className="text-lg shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {label}
                      </p>
                      <p className="text-[11px] text-gray-500">{sub}</p>
                    </div>
                    <Toggle on={on} onToggle={toggle} />
                  </div>
                ))}
              </div>

              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Entry Fee",
                    value: entryFee === "Free" ? "Free" : `${entryFee} coins`,
                    icon: <FaCoins className="text-yellow-400" />,
                  },
                  {
                    label: "Max Players",
                    value: maxPlayers,
                    icon: <FiUsers className="text-blue-400" />,
                  },
                  {
                    label: "Cards/Player",
                    value: cardLimit,
                    icon: <FaGamepad className="text-violet-400" />,
                  },
                  {
                    label: "Call Speed",
                    value: callSpeed,
                    icon: <MdTimer className="text-orange-400" />,
                  },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-sm">{icon}</span>
                    <div>
                      <p className="text-[10px] text-gray-500">{label}</p>
                      <p className="text-xs font-bold text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">
                  {error}
                </div>
              )}

              <Button
                loading={isPending}
                icon={<FaGamepad />}
                size="lg"
                onClick={handleCreate}
              >
                Create Room
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Room ID
                    </p>
                    <p className="text-lg font-black text-white tracking-widest">
                      {createdId?.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center">
                    <FaGamepad className="text-emerald-400 text-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Entry",
                      value: entryFee === "Free" ? "Free" : entryFee,
                    },
                    { label: "Players", value: `0/${maxPlayers}` },
                    { label: "Cards", value: cardLimit },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-white/[0.06] rounded-xl py-2 flex flex-col items-center gap-0.5"
                    >
                      <span className="text-sm font-black text-white">
                        {value}
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionLabel>Room Link</SectionLabel>
                <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3">
                  <span className="text-xs text-gray-400 flex-1 truncate">
                    {roomLink}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-all ${copied ? "text-emerald-400" : "text-gray-500 hover:text-white"}`}
                  >
                    {copied ? <FiCheck /> : <FiCopy />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse shrink-0" />
                <p className="text-xs text-gray-400">
                  Waiting for players to join...
                </p>
                <span className="text-xs font-black text-orange-400 ml-auto">
                  0/{maxPlayers}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  icon={<FiShare2 />}
                  onClick={handleCopy}
                >
                  Share Link
                </Button>
                <Button
                  icon={<FaGamepad />}
                  onClick={() => {
                    onEnter?.(createdId!);
                    onClose();
                  }}
                >
                  Enter Room
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
