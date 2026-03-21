import { useParams, useSearchParams } from "react-router-dom";
import { useBingoGameFlow } from "../features/bingo/hooks/useBingoGameFlow";
import { useAuthStore } from "../store/auth.store";
import { useWalletStore } from "../store/wallet.store";
import BingoLobby from "./bingo/BingoLobby";
import BingoRoomScreen from "./bingo/BingoRoomScreen";
import CardSelector from "./bingo/CardSelector";

export default function BingoGame() {
  const { id: roomIdParam } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const roomIdFromQuery = searchParams.get("room")?.trim() ?? "";
  const roomEntryId = roomIdParam ?? roomIdFromQuery;
  const balance = useWalletStore((s) => s.balance);
  const user = useAuthStore((s) => s.user);
  const flow = useBingoGameFlow({ roomEntryId, userId: user?.id });

  // ── Card select screen ──
  if (flow.screen === "card-select") {
    return (
      <CardSelector
        cards={flow.availableCards}
        selectedCardIds={flow.pendingCardIds}
        maxCount={flow.maxCardsToSelect}
        entryFee={flow.activeRoom?.entryFee ?? 0}
        balance={balance}
        loading={flow.claimingCards}
        error={flow.cardSelectionError}
        onToggle={flow.togglePendingCard}
        onConfirm={flow.confirmSelectedCards}
        onBack={flow.onCardSelectBack}
      />
    );
  }

  // ── Game screen ──
  if (flow.screen === "game" && flow.activeRoom) {
    return (
      <BingoRoomScreen
        activeRoom={flow.activeRoom}
        gameView={flow.gameView}
        isHost={flow.isHost}
        isSpectator={flow.isSpectator}
        playerCards={flow.playerCards}
        selectedCardId={flow.selectedCardId}
        roomCount={flow.roomCount}
        onBack={flow.onGameBack}
        onChangeView={flow.setGameView}
        onSelectCard={flow.setSelectedCardId}
      />
    );
  }

  return (
    <BingoLobby
      balance={balance}
      search={flow.search}
      filter={flow.filter}
      code={flow.code}
      showCreate={flow.showCreate}
      payRoom={flow.payRoom}
      entryError={flow.entryError}
      roomsData={flow.roomsData}
      waiting={flow.waiting}
      playing={flow.playing}
      isLoading={flow.isLoading}
      rejoining={flow.rejoining}
      userId={user?.id}
      onSearchChange={flow.setSearch}
      onFilterChange={flow.setFilter}
      onCodeChange={flow.setCode}
      onCreateOpen={() => flow.setShowCreate(true)}
      onCreateClose={() => flow.setShowCreate(false)}
      onEnterCreatedRoom={flow.handleCreatedRoomEntry}
      onJoinRoom={flow.setPayRoom}
      onRejoinRoom={flow.handleRejoin}
      onSpectateRoom={flow.handleSpectate}
      onResolveRoomCode={flow.resolveRoom}
      onCodeResolved={flow.openRoomFromLookup}
      onPaymentClose={flow.closePayment}
      onPaymentConfirm={flow.handlePaymentConfirm}
      onEntryErrorChange={flow.setEntryError}
    />
  );
}
