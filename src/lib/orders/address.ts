import { countryName } from "@/config/countries";

/** The address snapshot stored on an order (snake_case, like the rest of the database). */
export type ShippingAddress = {
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Reads an order's shipping_address JSON defensively, so a malformed row never breaks a page. */
export function readShippingAddress(json: unknown): ShippingAddress {
  const a = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  return {
    fullName: str(a.full_name) ?? str(a.fullName) ?? "",
    phone: str(a.phone),
    line1: str(a.line1) ?? "",
    line2: str(a.line2),
    city: str(a.city) ?? "",
    region: str(a.region),
    postalCode: str(a.postal_code) ?? str(a.postalCode) ?? "",
    countryCode: str(a.country_code) ?? str(a.countryCode) ?? "",
  };
}

/** Address lines for display: name, street, "City, Region Postcode", country. */
export function addressLines(address: ShippingAddress): string[] {
  const street = [address.line1, address.line2].filter(Boolean).join(", ");
  const place = [[address.city, address.region].filter(Boolean).join(", "), address.postalCode]
    .filter(Boolean)
    .join(" ");
  return [
    address.fullName,
    street,
    place,
    address.countryCode ? countryName(address.countryCode) : "",
  ].filter(Boolean);
}
