/**
 * Returns the Next.js basePath for use in manual fetch() calls.
 * Next.js auto-prepends basePath for <Link> and router, but NOT for fetch().
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/nutri';

/** Prepend basePath to an API path. e.g. apiUrl('/api/foods') → '/nutri/api/foods' */
export function apiUrl(path: string): string {
  return `${basePath}${path}`;
}
