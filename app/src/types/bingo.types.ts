export interface BingoChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  avatar?: string | null;
  message: string;
  sentAt: string;
}
