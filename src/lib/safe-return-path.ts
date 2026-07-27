const RETURN_URL_BASE = 'https://return-path.invalid';
const UNSAFE_CONTROL_CHARACTERS = /[\u0000-\u001f]/;
const SECURITY_RELEVANT_ESCAPE = /%(?:0[0-9a-f]|1[0-9a-f]|25|2e|2f|5c)/gi;
const MAX_DECODE_PASSES = 8;

function decodeSecurityRelevantEscapes(value: string): string {
  return value.replace(SECURITY_RELEVANT_ESCAPE, (escape) =>
    String.fromCharCode(Number.parseInt(escape.slice(1), 16))
  );
}

function isSameOriginPath(value: string): boolean {
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    UNSAFE_CONTROL_CHARACTERS.test(value)
  ) {
    return false;
  }

  const parsed = new URL(value, RETURN_URL_BASE);
  if (parsed.origin !== RETURN_URL_BASE) {
    return false;
  }

  return !parsed.pathname.startsWith('//');
}

/**
 * Accept only a same-origin path. URL parsing catches network-path references
 * and browser backslash/dot-segment normalization. Decode only characters that
 * can change URL structure so valid encoded path data (including `%25`) stays
 * usable while recursively encoded redirect payloads are still rejected.
 */
export function sanitizeReturnPath(value: string | null | undefined): string {
  if (!value) {
    return '/';
  }

  try {
    let securityView = value;
    for (let pass = 0; pass <= MAX_DECODE_PASSES; pass++) {
      if (!isSameOriginPath(securityView)) {
        return '/';
      }

      const next = decodeSecurityRelevantEscapes(securityView);
      if (next === securityView) {
        break;
      }
      if (pass === MAX_DECODE_PASSES) {
        return '/';
      }
      securityView = next;
    }

    const parsed = new URL(value, RETURN_URL_BASE);
    const normalizedPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return normalizedPath;
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
