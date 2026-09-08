const PUBLIC_ROUTES = new Set(['/about', '/demo', '/pricing', '/terms', '/privacy']);

/** Normalize route paths so a trailing slash does not change the rendered page. */
export function normalizeRoute(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
}

/** Public pages do not need to initialize the authenticated editor session. */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.has(normalizeRoute(pathname));
}
