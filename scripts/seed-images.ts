/**
 * Downloads the catalog photography from Unsplash's CDN and uploads it to
 * Supabase Storage at the paths referenced by supabase/seed.sql.
 *
 *   npm run db:seed:images
 *
 * Images are cropped to 4:5 and converted to WebP by Unsplash's image service.
 */
import { categories, products } from "../supabase/seed/catalog";
import { createSeedAdminClient } from "./lib/admin-env";
import { categoryImagePath, productImagePath } from "./lib/seed-ids";

type Job = { bucket: string; path: string; cdn: string };

const CDN = "https://images.unsplash.com";
const params = "w=1600&h=2000&fit=crop&crop=entropy&fm=webp&q=80";

const jobs: Job[] = [
  ...categories.map((c) => ({
    bucket: "category-images",
    path: categoryImagePath(c.slug),
    cdn: c.image.cdn,
  })),
  ...products.flatMap((p) =>
    p.images.map((image, index) => ({
      bucket: "product-images",
      path: productImagePath(p.slug, index),
      cdn: image.cdn,
    })),
  ),
];

// Existing files are kept unless you pass --force (e.g. after changing a photo in the catalog).
const force = process.argv.includes("--force");

async function main() {
  const supabase = createSeedAdminClient();
  let done = 0;
  let skipped = 0;
  const failures: string[] = [];

  // Upload a few at a time to stay polite to both services.
  const queue = [...jobs];
  async function worker() {
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        if (!/^photo-[\w-]+$/.test(job.cdn)) throw new Error(`Unexpected image id ${job.cdn}`);
        const response = await fetch(`${CDN}/${job.cdn}?${params}`);
        if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`);
        const body = new Uint8Array(await response.arrayBuffer());
        const { error } = await supabase.storage.from(job.bucket).upload(job.path, body, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: force,
        });
        if (error && /exist|duplicate/i.test(error.message)) {
          skipped += 1;
          console.log(`- ${job.bucket}/${job.path} already exists, kept`);
          continue;
        }
        if (error) throw error;
        done += 1;
        console.log(`✓ ${job.bucket}/${job.path} (${Math.round(body.byteLength / 1024)} KB)`);
      } catch (error) {
        failures.push(`${job.bucket}/${job.path}: ${(error as Error).message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));

  console.log(`\nUploaded ${done}, kept ${skipped} existing, of ${jobs.length} images.`);
  if (failures.length > 0) {
    console.error(`Failed:\n  ${failures.join("\n  ")}`);
    process.exit(1);
  }
}

main();
