import { STORAGE_KEYS } from "../config/routes";

export function hasSeenOnboarding() {
  return localStorage.getItem(STORAGE_KEYS.onboardingDone) === "true";
}
