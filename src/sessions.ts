/**
 * Session handling built on the auth util (src/auth.ts).
 *
 * Sessions bind a caller-visible identity to the token the auth util holds.
 * All logic is local and deterministic — nothing here performs network calls.
 */

import { getToken } from "./auth";

export interface Session {
  id: string;
  token: string;
}

const sessions = new Map<string, Session>();
let nextId = 1;

/** Binds a new session to the given token. */
export function createSession(token: string): Session {
  const session: Session = { id: `session-${nextId++}`, token };
  sessions.set(session.id, session);
  return session;
}

/**
 * Returns the session while its token still matches the auth util's current
 * token. The util refreshes silently — its cache changes without notifying
 * callers — so invalidation happens on read, by comparison. Callers should
 * treat a null return as "session no longer valid" and create a new one.
 */
export function getSession(id: string): Session | null {
  const session = sessions.get(id);
  if (!session) return null;
  if (session.token !== getToken()) {
    sessions.delete(id);
    return null;
  }
  return session;
}
