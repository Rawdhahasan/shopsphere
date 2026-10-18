import { Suspense } from "react";
import Link from "next/link";
import { MapPin, Pencil, Plus } from "lucide-react";
import { Alert, Badge, buttonVariants, Card, EmptyState } from "@/components/ui";
import { countryName } from "@/config/countries";
import { deleteAddress, setDefaultAddress } from "@/features/account/actions";
import {
  AccountPageHeader,
  AccountSectionSkeleton,
} from "@/features/account/components/account-page";
import { DeleteAddressButton } from "@/features/account/components/delete-address-button";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Addresses" };

async function AddressList({
  searchParams,
}: Pick<PageProps<"/account/addresses">, "searchParams">) {
  await requireUser("/account/addresses");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  const notice =
    params.saved === "1" ? "Address saved." : params.deleted === "1" ? "Address deleted." : null;

  if (!addresses?.length) {
    return (
      <Card>
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Save an address to check out faster."
          action={
            <Link href="/account/addresses/new" className={buttonVariants()}>
              Add an address
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {notice && <Alert tone="success">{notice}</Alert>}
      <ul className="grid gap-4 md:grid-cols-2">
        {addresses.map((address) => {
          const name = address.label ? `the ${address.label} address` : "this address";
          return (
            <li key={address.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{address.label ?? address.full_name}</p>
                  {address.is_default && <Badge tone="inverse">Default</Badge>}
                </div>
                <address className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft not-italic">
                  {address.full_name}
                  <br />
                  {address.line1}
                  {address.line2 && (
                    <>
                      <br />
                      {address.line2}
                    </>
                  )}
                  <br />
                  {[address.city, address.region, address.postal_code].filter(Boolean).join(", ")}
                  <br />
                  {countryName(address.country_code)}
                  {address.phone && (
                    <>
                      <br />
                      {address.phone}
                    </>
                  )}
                </address>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
                  <Link
                    href={`/account/addresses/${address.id}/edit`}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
                  >
                    <Pencil className="size-4" aria-hidden="true" /> Edit
                  </Link>
                  {!address.is_default && (
                    <form action={setDefaultAddress} className="flex">
                      <input type="hidden" name="addressId" value={address.id} />
                      <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                        Set as default
                      </button>
                    </form>
                  )}
                  <form action={deleteAddress} className="ml-auto flex">
                    <input type="hidden" name="addressId" value={address.id} />
                    <DeleteAddressButton label={name} />
                  </form>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AddressesPage({ searchParams }: PageProps<"/account/addresses">) {
  return (
    <>
      <AccountPageHeader
        title="Addresses"
        description="Where we'll send your orders."
        actions={
          <Link href="/account/addresses/new" className={buttonVariants({ variant: "secondary" })}>
            <Plus className="size-4" aria-hidden="true" /> Add address
          </Link>
        }
      />
      <Suspense fallback={<AccountSectionSkeleton />}>
        <AddressList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
