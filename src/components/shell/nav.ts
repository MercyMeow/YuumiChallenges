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
