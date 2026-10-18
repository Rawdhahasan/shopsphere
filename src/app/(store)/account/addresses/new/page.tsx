import { Suspense } from "react";
import { createAddress } from "@/features/account/actions";
import {
  AccountPageHeader,
  AccountSectionSkeleton,
} from "@/features/account/components/account-page";
import { AddressForm, emptyAddress } from "@/features/account/components/address-form";
import { getCurrentProfile, requireUser } from "@/lib/auth/session";

export const metadata = { title: "Add an address" };

async function NewAddress() {
  await requireUser("/account/addresses/new");
  const profile = await getCurrentProfile();
  return (
    <AddressForm
      action={createAddress}
      submitLabel="Save address"
      defaults={{ ...emptyAddress, fullName: profile?.fullName ?? "", phone: profile?.phone ?? "" }}
    />
  );
}

export default function NewAddressPage() {
  return (
    <>
      <AccountPageHeader title="Add an address" />
      <Suspense fallback={<AccountSectionSkeleton />}>
        <NewAddress />
      </Suspense>
    </>
  );
}
