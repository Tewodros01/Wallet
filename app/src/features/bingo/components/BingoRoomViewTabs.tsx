import { FiRadio, FiUser } from "react-icons/fi";

type GameView = "player" | "caller";

type BingoRoomViewTabsProps = {
  gameView: GameView;
  isSpectator: boolean;
  onChangeView: (view: GameView) => void;
};

export default function BingoRoomViewTabs({
  gameView,
  isSpectator,
  onChangeView,
}: BingoRoomViewTabsProps) {
  const availableViews = isSpectator
    ? [{ id: "caller" as GameView, label: "Live View", Icon: FiRadio }]
    : [
        { id: "player" as GameView, label: "Player", Icon: FiUser },
        { id: "caller" as GameView, label: "Caller", Icon: FiRadio },
      ];

  return (
    <div className="flex gap-2 px-4 pb-3">
      {availableViews.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChangeView(id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            gameView === id
              ? "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]"
              : "bg-white/[0.05] text-gray-400 hover:bg-white/10"
          }`}
        >
          <Icon className="text-sm" />
          {label}
        </button>
      ))}
    </div>
  );
}
