/** Countries ShopSphere ships to (ISO 3166-1 alpha-2), shown in address forms. */
export const SHIPPING_COUNTRIES = [
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BD", name: "Bangladesh" },
  { code: "BE", name: "Belgium" },
  { code: "CA", name: "Canada" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "HK", name: "Hong Kong" },
  { code: "IN", name: "India" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "MY", name: "Malaysia" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NO", name: "Norway" },
  { code: "PT", name: "Portugal" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
] as const;

export type CountryCode = (typeof SHIPPING_COUNTRIES)[number]["code"];

export const COUNTRY_CODES = SHIPPING_COUNTRIES.map((c) => c.code) as [
  CountryCode,
  ...CountryCode[],
];

export function countryName(code: string): string {
  return SHIPPING_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
