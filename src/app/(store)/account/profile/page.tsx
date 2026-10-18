import { Suspense } from "react";
import { updateProfile } from "@/features/account/actions";
import {
  AccountPageHeader,
  AccountSectionSkeleton,
} from "@/features/account/components/account-page";
import { ProfileForm } from "@/features/account/components/profile-form";
import { getCurrentProfile, requireUser } from "@/lib/auth/session";

export const metadata = { title: "Profile" };

async function Profile() {
  await requireUser("/account/profile");
  const profile = await getCurrentProfile();
  if (!profile) return null;
  return (
    <ProfileForm
      action={updateProfile}
      email={profile.email}
      defaults={{ fullName: profile.fullName ?? "", phone: profile.phone ?? "" }}
    />
  );
}

export default function ProfilePage() {
  return (
    <>
      <AccountPageHeader title="Profile" description="Your name and contact details." />
      <Suspense fallback={<AccountSectionSkeleton />}>
        <Profile />
      </Suspense>
    </>
  );
}
