import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth.store";

let gameSocket: Socket | null = null;
let notifSocket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!gameSocket) {
    const token = useAuthStore.getState().accessToken;
    gameSocket = io(`${import.meta.env.VITE_WS_URL as string}/game`, {
      auth: { token },
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return gameSocket;
};

export const connectSocket = () => {
  const s = getSocket();
  s.auth = { token: useAuthStore.getState().accessToken };
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  gameSocket?.disconnect();
  gameSocket = null;
};

/** Notifications socket — connects once on login, disconnects on logout */
export const getNotifSocket = (): Socket => {
  if (!notifSocket) {
    const token = useAuthStore.getState().accessToken;
    notifSocket = io(`${import.meta.env.VITE_WS_URL as string}/notifications`, {
      auth: { token },
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return notifSocket;
};

export const connectNotifSocket = () => {
  const s = getNotifSocket();
  s.auth = { token: useAuthStore.getState().accessToken };
  if (!s.connected) s.connect();
  return s;
};

export const disconnectNotifSocket = () => {
  notifSocket?.disconnect();
  notifSocket = null;
};
