import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  roomsApi,
  type CreateRoomPayload,
  type RoomQuery,
} from "../../../../api/rooms.api";
import type { GameRoomDetail } from "../../../../types/game.types";
import { roomKeys } from "./queryKeys";

export { useBingoCardSelection } from "./useBingoCardSelection";
export { useBingoRoomEntry } from "./useBingoRoomEntry";
export { useBingoGameFlow } from "./useBingoGameFlow";
export { useBingoChat } from "../useBingoChat";
export { roomKeys } from "./queryKeys";
export { useMyStats } from "../../../../hooks/useUser";
export { useUnreadCount } from "../../../../hooks/useNotifications";

export const useRooms = (query?: RoomQuery) =>
  useQuery({
    queryKey: roomKeys.all(query),
    queryFn: () => roomsApi.getAll(query),
    refetchInterval: 5000,
  });

export const useRoom = (id: string, placeholder?: GameRoomDetail) =>
  useQuery({
    queryKey: roomKeys.one(id),
    queryFn: () => roomsApi.getOne(id),
    enabled: !!id,
    refetchInterval: 3000,
    placeholderData: placeholder,
  });

export const useGameHistory = () =>
  useQuery({ queryKey: roomKeys.history(), queryFn: roomsApi.getHistory });

export const useCreateRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoomPayload) => roomsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
};

export const useRemoveRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsApi.remove(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.removeQueries({ queryKey: roomKeys.one(id) });
    },
  });
};

export const useCancelRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsApi.cancel(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: roomKeys.one(id) });
    },
  });
};

export const useFinishRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsApi.finish(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: roomKeys.one(id) });
    },
  });
};

export const useMyPlayer = (id: string) =>
  useQuery({
    queryKey: roomKeys.myPlayer(id),
    queryFn: () => roomsApi.getMyPlayer(id),
    enabled: !!id,
    retry: false,
  });

export const useJoinRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password?: string }) =>
      roomsApi.join(id, password),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: roomKeys.one(id) });
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
};
