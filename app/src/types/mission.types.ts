import { MissionType, MissionCategory, NotificationType } from "./enums";

// ─── Mission Types ────────────────────────────────────────────────────────────

export interface Mission {
  id: string;
  title: string;
  desc: string;
  reward: number;
  total: number;
  type: MissionType;
  category: MissionCategory;
  icon: string;
  isActive: boolean;
  resetAt: string | null;
  createdAt: string;
}

export interface MissionWithProgress
  extends Omit<Mission, "isActive" | "resetAt" | "createdAt"> {
  progress: number;
  claimed: boolean;
  claimedAt: string | null;
  isActive?: boolean;
  resetAt?: string | null;
  createdAt?: string;
}

export type MissionListItem = MissionWithProgress;

export interface CreateMissionRequest {
  title: string;
  desc: string;
  reward: number;
  total?: number;
  type: MissionType;
  category: MissionCategory;
  icon?: string;
  resetAt?: string;
}

export interface UpdateMissionRequest {
  title?: string;
  desc?: string;
  reward?: number;
  total?: number;
  icon?: string;
  isActive?: boolean;
  resetAt?: string;
}

export interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  mission: Mission;
  progress: number;
  claimed: boolean;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimMissionRequest {
  missionId: string;
}

export interface MissionProgress {
  missionId: string;
  progress: number;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
}

export interface UpdateNotificationRequest {
  read: boolean;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}
