import type { MetadataRoute } from "next";
import { listCategories, listSitemapProducts } from "@/features/catalog/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const [categories, products] = await Promise.all([listCategories(), listSitemapProducts()]);
  return [
    { url: `${site}/`, changeFrequency: "daily", priority: 1 },
    { url: `${site}/products`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({
      url: `${site}/categories/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${site}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: `${site}/help/shipping`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${site}/help/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
