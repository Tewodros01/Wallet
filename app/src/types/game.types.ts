import { RoomStatus, GameSpeed, PlayerStatus } from "./enums";
import type { User } from "./user.types";

// ─── Game Types ───────────────────────────────────────────────────────────────

export interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  speed: GameSpeed;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  cardsPerPlayer: number;
  isPrivate: boolean;
  password: string | null;
  winnerId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameRoomRequest {
  name: string;
  speed?: GameSpeed;
  entryFee?: number;
  maxPlayers?: number;
  cardsPerPlayer?: number;
  isPrivate?: boolean;
  password?: string;
}

export interface UpdateGameRoomRequest {
  name?: string;
  speed?: GameSpeed;
  maxPlayers?: number;
  isPrivate?: boolean;
  password?: string;
}

export interface RoomPlayer {
  id: string;
  roomId: string;
  userId: string;
  status: PlayerStatus;
  cardId: string | null;
  markedNums: number[]; // JSON array
  hasBingo: boolean;
  prize: number;
  joinedAt: string;
  finishedAt: string | null;
}

export interface GameRoomPlayer extends RoomPlayer {
  user?: User;
  card?: BingoCard | null;
}

export interface GameRoomDetail extends GameRoom {
  host?: User;
  players?: GameRoomPlayer[];
  _count?: {
    players: number;
  };
}

export interface JoinRoomResponse {
  success: boolean;
  card?: BingoCard | null;
}

export interface RoomStateResponse {
  room?: GameRoomDetail;
}

export interface BingoCard {
  id: string;
  userId: string;
  board: number[][]; // 5x5 matrix
  createdAt: string;
}

export interface GameRound {
  id: string;
  roomId: string;
  calledNums: number[]; // JSON array
  currentNum: number | null;
  roundNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface JoinRoomRequest {
  password?: string;
}

export interface MarkNumberRequest {
  number: number;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalEarned: number;
  averageGameTime: number;
}
