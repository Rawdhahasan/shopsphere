import { LogOut } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { getCurrentProfile } from "@/lib/auth/session";

/** Signed-in admin's name and a sign-out button, for the sidebar footer. */
export async function AdminUserMenu() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") return null;
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{profile.fullName ?? "Admin"}</p>
        <p className="truncate text-xs text-ink-muted">{profile.email}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Sign out"
          className="inline-flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-subtle hover:text-ink"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
        </button>
      </form>
    </div>
  );
}
