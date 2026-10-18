import { describe, expect, it } from "vitest";
import { isGuestOnlyPath, isProtectedPath, safeRedirectPath } from "./routes";

describe("isProtectedPath", () => {
  it.each(["/account", "/account/orders", "/checkout", "/admin", "/admin/products/1"])(
    "protects %s",
    (path) => expect(isProtectedPath(path)).toBe(true),
  );

  it.each(["/", "/products", "/accounting", "/administrator", "/cart"])("allows %s", (path) =>
    expect(isProtectedPath(path)).toBe(false),
  );
});

describe("isGuestOnlyPath", () => {
  it("matches login and register only", () => {
    expect(isGuestOnlyPath("/login")).toBe(true);
    expect(isGuestOnlyPath("/register")).toBe(true);
    expect(isGuestOnlyPath("/logout")).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("keeps same-site paths", () => {
    expect(safeRedirectPath("/checkout?step=2")).toBe("/checkout?step=2");
  });

  it.each([
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
  ])("rejects %s", (next) => expect(safeRedirectPath(next, "/account")).toBe("/account"));
});
