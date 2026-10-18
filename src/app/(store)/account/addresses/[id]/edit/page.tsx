import { Suspense } from "react";
import { notFound } from "next/navigation";
import { updateAddress } from "@/features/account/actions";
import {
  AccountPageHeader,
  AccountSectionSkeleton,
} from "@/features/account/components/account-page";
import { AddressForm } from "@/features/account/components/address-form";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validation/account";

export const metadata = { title: "Edit address" };

async function EditAddress({ params }: Pick<PageProps<"/account/addresses/[id]/edit">, "params">) {
  const { id } = await params;
  await requireUser(`/account/addresses/${id}/edit`);
  if (!idSchema.safeParse(id).success) notFound();

  // RLS returns nothing for another customer's address, so this is a 404 too.
  const supabase = await createClient();
  const { data: address } = await supabase.from("addresses").select("*").eq("id", id).maybeSingle();
  if (!address) notFound();

  return (
    <AddressForm
      action={updateAddress.bind(null, address.id)}
      submitLabel="Save changes"
      defaults={{
        label: address.label ?? "",
        fullName: address.full_name,
        phone: address.phone ?? "",
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        region: address.region ?? "",
        postalCode: address.postal_code,
        countryCode: address.country_code,
        isDefault: address.is_default,
      }}
    />
  );
}

export default function EditAddressPage({ params }: PageProps<"/account/addresses/[id]/edit">) {
  return (
    <>
      <AccountPageHeader title="Edit address" />
      <Suspense fallback={<AccountSectionSkeleton />}>
        <EditAddress params={params} />
      </Suspense>
    </>
  );
}
