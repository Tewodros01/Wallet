import type { ApiErrorResponse } from "../types/withdrawal.types";

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
) {
  return (
    (error as ApiErrorResponse | undefined)?.response?.data?.message ?? fallback
  );
}
