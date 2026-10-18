/** Paths that require a signed-in user. Admin role checks happen on the server, not here. */
const PROTECTED_PREFIXES = ["/account", "/checkout", "/admin"] as const;

/** Auth pages a signed-in user doesn't need to see. */
const GUEST_ONLY_PATHS = ["/login", "/register"] as const;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((path) => matchesPrefix(pathname, path));
}

/**
 * Sanitises a ?next= redirect target so login can't be abused to send users
 * to another website (an "open redirect"). Only same-site relative paths pass.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
