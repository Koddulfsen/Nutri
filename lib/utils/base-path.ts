/**
 * Returns the Next.js basePath for use in manual fetch() calls.
 * Next.js auto-prepends basePath for <Link> and router, but NOT for fetch().
 *
 * The app is served at the domain root, so this is normally ''. It stays
 * configurable because the app previously lived under '/nutri' and may again;
 * every fetch() in the app goes through apiUrl() so that move is one variable.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** Prepend basePath to an API path. e.g. apiUrl('/api/foods') -> '/api/foods' */
export function apiUrl(path: string): string {
  return `${basePath}${path}`;
}
