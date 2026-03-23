import { useAuthStore } from "../store/auth.store";

export const useAppSession = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const needsOnboarding = user != null && !user.onboardingDone;

  return {
    isAuthenticated,
    user,
    isAdmin: user?.role === "ADMIN",
    needsOnboarding,
  };
};
