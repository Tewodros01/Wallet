// ─── Invite Types ────────────────────────────────────────────────────────────

export interface InvitedUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
}

export interface InviteData {
  code: string;
  invitedUsers: InvitedUser[];
}