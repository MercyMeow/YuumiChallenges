const RETURN_URL_BASE = 'https://return-path.invalid';

/**
 * Accept only a same-origin path. URL parsing catches network-path references
 * and browser backslash normalization; decoded checks also reject encoded
 * variants before they can pass through another redirecting layer.
 */
export function sanitizeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || /[\u0000-\u001f\\]/.test(value)) {
    return '/';
  }

  try {
    let decoded = value;
    for (let pass = 0; ; pass++) {
      const next = decodeURIComponent(decoded);
      if (
        !next.startsWith('/') ||
        next.startsWith('//') ||
        /[\u0000-\u001f\\]/.test(next)
      ) {
        return '/';
      }
      if (next === decoded) break;
      if (pass >= 7) return '/';
      decoded = next;
    }

    const parsed = new URL(value, RETURN_URL_BASE);
    if (parsed.origin !== RETURN_URL_BASE) {
      return '/';
    }
    const normalizedPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return normalizedPath.startsWith('//') ? '/' : normalizedPath;
  } catch {
    return '/';
  }
}

export function createReturnUrl(
  site: string,
  returnPath: string,
  state: { key: string; value: string }
): URL {
  const siteUrl = new URL(`${site}/`);
  const destination = new URL(sanitizeReturnPath(returnPath), siteUrl);
  if (destination.origin !== siteUrl.origin) {
    const fallback = new URL('/', siteUrl);
    fallback.searchParams.set(state.key, state.value);
    return fallback;
  }
  destination.searchParams.set(state.key, state.value);
  return destination;
}
