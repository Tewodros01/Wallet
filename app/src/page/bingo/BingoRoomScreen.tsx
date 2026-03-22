import BingoRoomHeader from "../../features/bingo/components/BingoRoomHeader";
import BingoRoomViewTabs from "../../features/bingo/components/BingoRoomViewTabs";
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
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-xl border-b border-white/7">
        <BingoRoomHeader
          roomCode={activeRoom.id.slice(-8).toUpperCase()}
          isSpectator={isSpectator}
          onBack={onBack}
        />
        <BingoRoomViewTabs
          gameView={gameView}
          isSpectator={isSpectator}
          onChangeView={onChangeView}
        />
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
