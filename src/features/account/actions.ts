"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { errorState, parseForm, type FormState } from "@/lib/forms/form-state";
import { createClient } from "@/lib/supabase/server";
import {
  addressSchema,
  idSchema,
  profileSchema,
  type AddressInput,
} from "@/lib/validation/account";

/**
 * Account Server Actions. Each one re-checks the session (actions can be
 * called directly over HTTP) and writes through the user's own Supabase
 * client, so Row-Level Security limits it to the user's own rows.
 */

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const parsed = parseForm(profileSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone })
    .eq("id", user.id);
  if (error) return errorState("We couldn't save your profile. Please try again.", formData);

  revalidatePath("/account", "layout");
  return {
    status: "success",
    message: "Your profile has been saved.",
    values: { ...parsed.data, phone: parsed.data.phone ?? "" },
  };
}

const toRow = (input: AddressInput) => ({
  label: input.label,
  full_name: input.fullName,
  phone: input.phone,
  line1: input.line1,
  line2: input.line2,
  city: input.city,
  region: input.region,
  postal_code: input.postalCode,
  country_code: input.countryCode,
  is_default: input.isDefault,
});

export async function createAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/addresses/new");
  const parsed = parseForm(addressSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const { error } = await supabase
    .from("addresses")
    .insert({ ...toRow(parsed.data), user_id: user.id });
  if (error) return errorState("We couldn't save this address. Please try again.", formData);

  revalidatePath("/account/addresses");
  // Only checkout may ask to come back; anything else goes to the address book.
  redirect(formData.get("returnTo") === "/checkout" ? "/checkout" : "/account/addresses?saved=1");
}

export async function updateAddress(
  addressId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser("/account/addresses");
  if (!idSchema.safeParse(addressId).success) return errorState("This address no longer exists.");
  const parsed = parseForm(addressSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .update(toRow(parsed.data))
    .eq("id", addressId)
    .select("id");
  if (error) return errorState("We couldn't save this address. Please try again.", formData);
  if (!data?.length) return errorState("This address no longer exists.");

  revalidatePath("/account/addresses");
  redirect("/account/addresses?saved=1");
}

export async function deleteAddress(formData: FormData): Promise<void> {
  await requireUser("/account/addresses");
  const id = idSchema.safeParse(formData.get("addressId"));
  if (id.success) {
    const supabase = await createClient();
    const { data: deleted } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id.data)
      .select("is_default");

    // If the default was deleted, promote the oldest remaining address.
    if (deleted?.[0]?.is_default) {
      const { data: next } = await supabase
        .from("addresses")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (next) await supabase.from("addresses").update({ is_default: true }).eq("id", next.id);
    }
  }
  revalidatePath("/account/addresses");
  redirect("/account/addresses?deleted=1");
}

export async function setDefaultAddress(formData: FormData): Promise<void> {
  await requireUser("/account/addresses");
  const id = idSchema.safeParse(formData.get("addressId"));
  if (id.success) {
    const supabase = await createClient();
    // The database trigger clears the previous default in the same transaction.
    await supabase.from("addresses").update({ is_default: true }).eq("id", id.data);
  }
  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}
