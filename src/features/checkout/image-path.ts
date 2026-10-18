/**
 * Order items keep the Storage path of their photo (not the full URL), so the
 * order history still works if the Supabase URL ever changes.
 * ".../storage/v1/object/public/product-images/products/x/1.webp" → "products/x/1.webp"
 */
export function productImagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = "/storage/v1/object/public/product-images/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url
    .slice(index + marker.length)
    .split("/")
    .map(decodeURIComponent)
    .join("/");
}
