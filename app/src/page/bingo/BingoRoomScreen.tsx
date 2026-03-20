import { FiArrowLeft, FiRadio, FiUser } from "react-icons/fi";
import { GameProvider } from "../../hooks/GameProvider";
import type { GameRoomDetail, PlayerCard } from "../../types/game.types";
import CalledDashboard from "./CalledDashboard";
import CallerDashboard from "./CallerDashboard";

type GameView = "player" | "caller";

interface BingoRoomScreenProps {
  activeRoom: GameRoomDetail;
  gameView: GameView;
  isHost: boolean;
  isSpectator: boolean;
  playerCards: PlayerCard[];
  selectedCardId: string | null;
  roomCount: number;
  onBack: () => void;
  onChangeView: (view: GameView) => void;
  onSelectCard: (cardId: string) => void;
}

export default function BingoRoomScreen({
  activeRoom,
  gameView,
  isHost,
  isSpectator,
  playerCards,
  selectedCardId,
  roomCount,
  onBack,
  onChangeView,
  onSelectCard,
}: BingoRoomScreenProps) {
  const availableViews = isSpectator
    ? [{ id: "caller" as GameView, label: "Live View", Icon: FiRadio }]
    : [
        { id: "player" as GameView, label: "Player", Icon: FiUser },
        { id: "caller" as GameView, label: "Caller", Icon: FiRadio },
      ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors shrink-0"
          >
            <FiArrowLeft className="text-white text-sm" />
          </button>
          <span className="text-base font-black text-white">Bingo Game</span>
          {isSpectator && (
            <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-300">
              Spectating
            </span>
          )}
          <span className="ml-auto text-[10px] text-gray-500 font-mono">
            {activeRoom.id.slice(-8).toUpperCase()}
          </span>
        </div>
        <div className="flex gap-2 px-4 pb-3">
          {availableViews.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChangeView(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
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
      </div>
      <div className="flex-1">
        <GameProvider
          key={`${isSpectator ? "spectator" : "player"}:${activeRoom.id}`}
          roomId={activeRoom.id}
          initialCards={playerCards}
          initialActiveCardId={selectedCardId}
          participationMode={isSpectator ? "spectator" : "player"}
        >
          {!isSpectator && gameView === "player" && (
            <CalledDashboard
              cards={playerCards}
              selectedCardId={selectedCardId}
              onSelectCard={onSelectCard}
              roomId={activeRoom.id}
              playerCount={roomCount}
              roomData={activeRoom}
            />
          )}
          {gameView === "caller" && (
            <CallerDashboard roomId={activeRoom.id} isHost={isHost} />
          )}
        </GameProvider>
      </div>
    </div>
  );
}
