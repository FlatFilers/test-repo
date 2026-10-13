import { strict as assert } from "node:assert/strict";
import { describe, it } from "node:test";
import { getToken, refreshToken } from "./auth";

describe("refreshToken", () => {
  it("refreshes an expired token and caches it", () => {
    const refreshed = refreshToken("expired-abc123");
    assert.equal(refreshed, "refreshed-abc123");
    assert.equal(getToken(), "refreshed-abc123");
  });

  it("passes live tokens through unchanged", () => {
    assert.equal(refreshToken("live-token"), "live-token");
    assert.equal(getToken(), "live-token");
  });
});
