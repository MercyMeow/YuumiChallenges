/**
 * Whether a nav href matches the current pathname. Hash links (in-page
 * anchors like `/#builds`) never register as active. Shared by TopNav and
 * SideRail so the active-state rule stays in one place.
 */
export function isActiveLink(pathname: string, href: string): boolean {
  if (href.includes('#')) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Guide-page section anchors tracked by the nav scroll spy, in page order. */
export const HOME_SECTION_IDS = ['builds', 'abilities', 'matchups'] as const;

/**
 * Active-state rule that also understands the guide page's hash anchors:
 * on `/`, "Overview" is lit only above the first section, and each hash link
 * lights up while its section fills the viewport (per the scroll spy).
 */
export function isGuideLinkActive(
  pathname: string,
  href: string,
  activeSection: string | null
): boolean {
  const hash = href.includes('#') ? href.split('#')[1] : undefined;
  if (pathname !== '/' || (!hash && href !== '/')) {
    return isActiveLink(pathname, href);
  }
  if (!hash) return activeSection === null;
  return activeSection === hash;
}
