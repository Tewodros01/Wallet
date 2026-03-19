import { TournamentStatus } from "./enums";
import type { User } from "./user.types";

export interface Tournament {
  id: string;
  name: string;
  subtitle: string | null;
  prize: number;
  entryFee: number;
  maxPlayers: number;
  joinedCount: number;
  status: TournamentStatus;
  sponsored: string | null;
  startsAt: string;
  finishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  isJoined?: boolean;
}

export interface TournamentLeaderboardEntry {
  rank: number;
  user: Pick<User, "id" | "username" | "firstName" | "lastName" | "avatar">;
  tournamentsPlayed: number;
  totalPrize: number;
}

export interface CreateTournamentRequest {
  name: string;
  subtitle?: string;
  prize: number;
  entryFee?: number;
  maxPlayers?: number;
  sponsored?: string;
  startsAt: string;
}

export interface UpdateTournamentRequest {
  name?: string;
  subtitle?: string;
  prize?: number;
  entryFee?: number;
  maxPlayers?: number;
  status?: TournamentStatus;
  sponsored?: string;
  startsAt?: string;
  finishedAt?: string;
}

export interface TournamentPlayer {
  id: string;
  tournamentId: string;
  userId: string;
  joinedAt: string;
}

export interface JoinTournamentRequest {
  tournamentId: string;
}

export type TournamentForm = {
  name: string;
  subtitle: string;
  prize: string;
  entryFee: string;
  maxPlayers: string;
  startsAt: string;
  sponsored: string;
};

export type TournamentFormKey = keyof TournamentForm;

export const TOURNAMENT_STATUS_STYLE: Record<TournamentStatus, string> = {
  [TournamentStatus.LIVE]: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  [TournamentStatus.UPCOMING]:
    "bg-violet-500/20 text-violet-400 border-violet-500/30",
  [TournamentStatus.FINISHED]:
    "bg-gray-500/20 text-gray-500 border-gray-500/30",
  [TournamentStatus.CANCELLED]:
    "bg-gray-500/20 text-gray-500 border-gray-500/30",
};
