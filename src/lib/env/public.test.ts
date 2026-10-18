import { describe, expect, it } from "vitest";
import { looksLikeSecretSupabaseKey } from "./public";

function fakeJwt(payload: object) {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, "");
  return `${encode({ alg: "HS256" })}.${encode(payload)}.signature`;
}

describe("looksLikeSecretSupabaseKey", () => {
  it("flags new-style secret keys", () => {
    expect(looksLikeSecretSupabaseKey("sb_secret_abc123")).toBe(true);
  });

  it("flags legacy service_role JWTs", () => {
    expect(looksLikeSecretSupabaseKey(fakeJwt({ role: "service_role" }))).toBe(true);
  });

  it("accepts publishable and anon keys", () => {
    expect(looksLikeSecretSupabaseKey("sb_publishable_abc123")).toBe(false);
    expect(looksLikeSecretSupabaseKey(fakeJwt({ role: "anon" }))).toBe(false);
  });
});
