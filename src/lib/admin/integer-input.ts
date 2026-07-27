export const MAX_ADMIN_PRIORITY = 1_000_000;

/**
 * Parses an editor integer without accepting decimal or exponent notation.
 *
 * Form fields keep their raw text until submission so values such as `1.5`
 * and `1e3` can be rejected instead of being truncated or reinterpreted.
 */
export function parseAdminIntegerInput(
  value: string,
  options: {
    minimum: number;
    maximum?: number;
  }
): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  const maximum = options.maximum ?? Number.MAX_SAFE_INTEGER;
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < options.minimum ||
    parsed > maximum
  ) {
    return null;
  }

  return parsed;
}
