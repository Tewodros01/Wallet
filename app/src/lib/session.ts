import { disconnectNotifSocket, disconnectSocket } from "./socket";
import { useAuthStore } from "../store/auth.store";

export const clearClientSession = () => {
  disconnectNotifSocket();
  disconnectSocket();
  useAuthStore.getState().clear();
};
