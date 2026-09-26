import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isUuid } from "./identifiers";

describe("route identifiers", () => {
  it("accepts valid UUID record identifiers", () => {
    assert.equal(isUuid("123e4567-e89b-42d3-a456-426614174000"), true);
  });

  it("rejects malformed route identifiers before database access", () => {
    assert.equal(isUuid("not-a-record-id"), false);
    assert.equal(isUuid("123e4567-e89b-92d3-a456-426614174000"), false);
  });
});
