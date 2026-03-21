import { ConfigService } from '@nestjs/config';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

export function getPublicApiUrl(configService: ConfigService): string {
  return configService
    .get<string>(
      'publicApiUrl',
      `http://localhost:${configService.get<number>('port', 3000)}`,
    )
    .replace(/\/$/, '');
}

export function toPublicAssetUrl(
  path: string | null,
  publicApiUrl: string,
): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  return `${publicApiUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function normalizeAvatarUrls<T>(value: T, publicApiUrl: string): T {
  return normalizePublicAssetFields(value, publicApiUrl, ['avatar']);
}

export function normalizePublicAssetFields<T>(
  value: T,
  publicApiUrl: string,
  fields: string[],
): T {
  if (Array.isArray(value)) {
    return value.map((item) =>
      normalizePublicAssetFields(item, publicApiUrl, fields),
    ) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const normalized = Object.entries(value).map(([key, entryValue]) => {
    if (
      fields.includes(key) &&
      (typeof entryValue === 'string' || entryValue === null)
    ) {
      return [key, toPublicAssetUrl(entryValue, publicApiUrl)];
    }

    return [key, normalizePublicAssetFields(entryValue, publicApiUrl, fields)];
  });

  return Object.fromEntries(normalized) as T;
}
