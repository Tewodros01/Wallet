import type { GameRoomDetail } from "./game.types";

export interface CalledDashboardProps {
  card: number[][] | null;
  roomId: string;
  playerCount: number;
  roomData?: GameRoomDetail;
}

export interface BingoChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string | null;
  message: string;
  sentAt: string;
}
