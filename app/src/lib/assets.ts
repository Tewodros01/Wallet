export function getPublicAssetUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;

  const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
  const publicBase = apiBase.replace(/\/api\/v1\/?$/, "");
  return new URL(path, `${publicBase}/`).toString();
}

export function getAvatarInitials(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "?",
) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return initials || fallback;
}
