import { strict as assert } from "node:assert/strict";
import { describe, it } from "node:test";
import { getToken, refreshToken } from "./auth";
import { createSession, getSession } from "./sessions";

describe("sessions", () => {
  it("binds a session to the util's current token and reads it back", () => {
    const token = refreshToken("live-token");
    const session = createSession(token);
    assert.equal(getSession(session.id)?.token, token);
  });

  it("keeps a session valid across repeated reads while the token is unchanged", () => {
    const token = refreshToken("live-token");
    const session = createSession(token);
    assert.notEqual(getSession(session.id), null);
    assert.notEqual(getSession(session.id), null);
    assert.equal(getSession(session.id)?.token, token);
  });

  it("invalidates a session on read after the util refreshes the token", () => {
    const token = refreshToken("live-token");
    const session = createSession(token);

    // The util re-caches silently; nothing notifies this module.
    refreshToken(`expired-${token}`);
    assert.equal(getToken(), `refreshed-${token}`);

    assert.equal(getSession(session.id), null);
  });

  it("returns null for an unknown session id", () => {
    assert.equal(getSession("session-9999"), null);
  });
});
