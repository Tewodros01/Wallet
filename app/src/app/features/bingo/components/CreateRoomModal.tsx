import { useState } from "react";
import { FaCoins, FaLock, FaUnlock } from "react-icons/fa";
import { FiCheck, FiCopy, FiShare2, FiX } from "react-icons/fi";
import { useCreateRoom } from "../hooks";
import { getErrorMessage } from "../../../../lib/errors";
import { GameSpeed } from "../../../../types/enums";
import type { GameRoomDetail } from "../../../../types/game.types";
import Button from "../../../components/ui/Button";

type Props = {
  onClose: () => void;
  onEnter?: (room: GameRoomDetail) => void | Promise<void>;
};

type Step = "settings" | "created";

const ENTRY_FEES = ["Free", "50", "100", "200", "500", "1000"];
const MAX_PLAYERS = ["10", "20", "50", "100", "200"];
const CARD_LIMITS = ["1", "2", "3", "5"];
const ROOM_RAKE_BPS = 1000;
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
          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
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
  const [password, setPassword] = useState("");
  const [createdRoom, setCreatedRoom] = useState<GameRoomDetail | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entryFeeNum = entryFee === "Free" ? 0 : Number(entryFee);
  const grossPrize = entryFeeNum * Number(maxPlayers);
  const prize = grossPrize - Math.floor((grossPrize * ROOM_RAKE_BPS) / 10_000);
  const roomLink = createdId
    ? `${window.location.origin}/game?room=${createdId}`
    : "";

  const handleCreate = () => {
    setError(null);

    if (isPrivate && password.trim().length < 4) {
      setError("Private rooms need a password with at least 4 characters");
      return;
    }

    createRoom(
      {
        name:
          roomName || `Room ${Date.now().toString(36).toUpperCase().slice(-4)}`,
        speed: callSpeed,
        entryFee: entryFeeNum,
        maxPlayers: Number(maxPlayers),
        cardsPerPlayer: Number(cardLimit),
        isPrivate,
        password: isPrivate ? password.trim() : undefined,
      },
      {
        onSuccess: (data: GameRoomDetail) => {
          setCreatedRoom(data);
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
                  className="w-full bg-white/6 text-white placeholder-gray-600 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all"
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
                      Est. Prize Pool After Fee
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

              <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
                {[
                  {
                    icon: <FaLock className="text-violet-400" />,
                    title: "Private Room",
                    desc: "Only players with the password can join",
                    value: isPrivate,
                    onToggle: () => setIsPrivate((v) => !v),
                  },
                ].map(({ icon, title, desc, value, onToggle }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 px-4 py-3.5"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                      {value ? icon : <FaUnlock className="text-gray-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="text-[11px] text-gray-500">{desc}</p>
                    </div>
                    <Toggle on={value} onToggle={onToggle} />
                  </div>
                ))}
              </div>

              {isPrivate && (
                <div className="flex flex-col gap-2">
                  <SectionLabel>Password</SectionLabel>
                  <input
                    type="password"
                    aria-label="Room password"
                    placeholder="Minimum 4 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/6 text-white placeholder-gray-600 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              )}

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold">
                  {error}
                </div>
              )}

              <Button
                loading={isPending}
                icon={<FiCheck />}
                onClick={handleCreate}
              >
                Create Room
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <FiShare2 className="text-emerald-400 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">
                      {createdRoom?.name ?? "Your Room"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Share the room code and invite friends
                    </p>
                  </div>
                </div>

                <div className="bg-black/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                      Room Code
                    </p>
                    <p className="text-lg font-black text-white tracking-widest">
                      {createdId?.slice(-8).toUpperCase() ?? "----"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors shrink-0"
                  >
                    {copied ? (
                      <FiCheck className="text-emerald-400" />
                    ) : (
                      <FiCopy className="text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    icon: <FaCoins className="text-yellow-300" />,
                    label: "Entry",
                    value:
                      entryFeeNum === 0 ? "Free" : `${entryFeeNum.toLocaleString()}`,
                  },
                  {
                    icon: <FiShare2 className="text-cyan-300" />,
                    label: "Players",
                    value: maxPlayers,
                  },
                  {
                    icon: <FiCopy className="text-violet-300" />,
                    label: "Cards",
                    value: cardLimit,
                  },
                ].map(({ icon, label, value }) => (
                  <div
                    key={label}
                    className="bg-white/4 border border-white/7 rounded-2xl py-3 flex flex-col items-center gap-1"
                  >
                    <span>{icon}</span>
                    <span className="text-sm font-black text-white">{value}</span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  icon={<FiCheck />}
                  onClick={async () => {
                    if (!createdRoom || !onEnter) return;
                    await onEnter(createdRoom);
                  }}
                >
                  Enter Room
                </Button>
                <Button variant="ghost" icon={<FiCopy />} onClick={handleCopy}>
                  {copied ? "Copied Link" : "Copy Invite Link"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
