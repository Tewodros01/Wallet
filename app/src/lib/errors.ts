import type { ApiErrorResponse } from "../types/withdrawal.types";

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
) {
  const message = (error as ApiErrorResponse | undefined)?.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (Array.isArray(message)) {
    const flattened = message
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      .join(", ");

    if (flattened) {
      return flattened;
    }
  }

  return fallback;
}
