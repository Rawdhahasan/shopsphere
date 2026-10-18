/**
 * Public URL of a file in a public Supabase Storage bucket. Returns null
 * before Supabase is configured, so callers can show a placeholder.
 */
export function publicStorageUrl(
  bucket: "product-images" | "category-images" | "avatars",
  path: string | null | undefined,
): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !path) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${encoded}`;
}
