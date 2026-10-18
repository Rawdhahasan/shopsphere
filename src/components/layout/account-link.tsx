import Link from "next/link";
import { User } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";

const iconLink =
  "inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle";

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (name ? (parts[1]?.[0] ?? "") : "")).toUpperCase() || "?";
}

/** Shown while the session is read, and to signed-out visitors. */
export function AccountIcon() {
  return (
    <Link href="/login" className={iconLink} aria-label="Sign in">
      <User className="size-5" strokeWidth={1.75} />
    </Link>
  );
}

/** Header account button: the user's initials when signed in, otherwise a sign-in link. */
export async function AccountLink() {
  const profile = await getCurrentProfile();
  if (!profile) return <AccountIcon />;

  const href = profile.role === "admin" ? "/admin" : "/account";
  return (
    <Link
      href={href}
      className={iconLink}
      aria-label={`${profile.role === "admin" ? "Admin dashboard" : "My account"} (signed in as ${profile.fullName ?? profile.email})`}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-ink text-[11px] font-medium tracking-wide text-canvas">
        {initials(profile.fullName, profile.email)}
      </span>
    </Link>
  );
}
