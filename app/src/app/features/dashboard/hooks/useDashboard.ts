import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../../../../api/users.api";

export { useMe, useMyStats } from "../../../../hooks/useUser";
export { useUnreadCount } from "../../../../hooks/useNotifications";
export { useRooms } from "../../../../hooks/useRooms";
export { useClaimDailyBonus } from "../../payments";

export const useLeaderboard = (limit = 10) =>
  useQuery({
    queryKey: ["users", "leaderboard", limit],
    queryFn: () => usersApi.getLeaderboard(limit),
    staleTime: 60_000,
  });
