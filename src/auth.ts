/**
 * Minimal auth fixture.
 * All logic is local and deterministic — nothing here performs network calls.
 */

const EXPIRED_PREFIX = "expired-";
const REFRESHED_PREFIX = "refreshed-";

let cachedToken: string | null = null;

/** Returns the most recently seen token, or null before the first call. */
export function getToken(): string | null {
  return cachedToken;
}

/**
 * Stubbed refresh: tokens marked `expired-` come back refreshed,
 * live tokens pass through unchanged.
 */
export function refreshToken(token: string): string {
  const next = token.startsWith(EXPIRED_PREFIX)
    ? `${REFRESHED_PREFIX}${token.slice(EXPIRED_PREFIX.length)}`
    : token;
  cachedToken = next;
  return next;
}
