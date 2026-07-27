/**
 * Build icon keys rendered by the public guide.
 *
 * Keep the admin editor and API constrained to these values so choosing an
 * icon in the editor cannot silently fall back to a different public icon.
 */
export const ADMIN_BUILD_ICON_KEYS = ['star', 'shield', 'zap'] as const;

export type AdminBuildIcon = (typeof ADMIN_BUILD_ICON_KEYS)[number];

export function isAdminBuildIcon(value: string): value is AdminBuildIcon {
  return ADMIN_BUILD_ICON_KEYS.includes(value as AdminBuildIcon);
}
