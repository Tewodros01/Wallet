import { STORAGE_KEYS } from "../config/routes";
import { useAuthStore } from "../store/auth.store";

export const useAppSession = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const needsOnboarding =
    Boolean(user) &&
    !user.onboardingDone &&
    !localStorage.getItem(STORAGE_KEYS.onboardingDone);

  return {
    isAuthenticated,
    user,
    isAdmin: user?.role === "ADMIN",
    needsOnboarding,
  };
};
