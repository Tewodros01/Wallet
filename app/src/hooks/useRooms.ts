import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roomsApi, type CreateRoomPayload, type RoomQuery } from "../api/rooms.api";

export const roomKeys = {
  all:     (q?: RoomQuery) => ["rooms", q]    as const,
  one:     (id: string)    => ["rooms", id]   as const,
  history: ()              => ["rooms", "history"] as const,
};

export const useRooms = (query?: RoomQuery) =>
  useQuery({
    queryKey: roomKeys.all(query),
    queryFn:  () => roomsApi.getAll(query),
    refetchInterval: 5000, // poll lobby every 5s
  });

export const useRoom = (id: string, placeholder?: any) =>
  useQuery({
    queryKey: roomKeys.one(id),
    queryFn:  () => roomsApi.getOne(id),
    enabled:  !!id,
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

export const useMyPlayer = (id: string) =>
  useQuery({
    queryKey: [...roomKeys.one(id), "my-player"],
    queryFn:  () => roomsApi.getMyPlayer(id),
    enabled:  !!id,
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
