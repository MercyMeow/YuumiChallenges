export type JsonRecord = Record<string, unknown>;

export function isAllowedAdminOrigin(
  origin: string | null,
  expectedOrigin: string
): boolean {
  return origin === expectedOrigin;
}

export function getAdminErrorMessage(
  payload: unknown,
  fallback: string
): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof payload.error === 'string' &&
    payload.error.trim().length > 0
  ) {
    return payload.error;
  }
  return fallback;
}

export function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function shouldUseSecureAdminCookie(
  protocol: string,
  hostname: string
): boolean {
  const normalizedHostname = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const isLocalhost =
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1';

  return protocol === 'https:' || !isLocalhost;
}
