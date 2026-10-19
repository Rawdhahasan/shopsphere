"use server";

import { randomUUID } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { requireAdmin } from "@/lib/auth/session";
import { errorState, parseForm, type FormState } from "@/lib/forms/form-state";
import { parseMoneyToCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { newProductSchema, productSchema } from "@/lib/validation/product";
import {
  cartesian,
  makeSku,
  parseOptionsText,
  parseSpecifications,
  skuPrefixFromSlug,
  slugify,
} from "./editor";

/**
 * Admin product editing. Every action re-checks the admin role and uses the
 * admin's own Supabase client, so RLS and the stock function's own admin check
 * apply too. After each change the cached storefront ("catalog") is refreshed.
 */

const NOT_ADMIN = "Only admins can edit products.";
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024;

function changed() {
  updateTag(CATALOG_TAG);
  refresh();
}

const suffix = () => randomUUID().slice(0, 5).toUpperCase();

export async function saveProduct(
  productId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return errorState(NOT_ADMIN);
  const isNew = productId === null;
  const parsed = parseForm(isNew ? newProductSchema : productSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  const slug = d.slug || slugify(d.name);
  if (!slug) return errorState("Enter a URL slug.", formData);

  const row = {
    name: d.name,
    slug,
    category_id: d.categoryId,
    status: d.status,
    is_featured: d.featured,
    brand: d.brand,
    short_description: d.shortDescription,
    description: d.description,
    specifications: parseSpecifications(d.specifications),
    seo_title: d.seoTitle,
    seo_description: d.seoDescription,
  };
  const supabase = await createClient();
  const duplicate = (code?: string) =>
    errorState(
      code === "23505"
        ? "Another product already uses that URL slug."
        : "The product couldn't be saved. Please try again.",
      formData,
    );

  if (isNew) {
    const { data: created, error } = await supabase
      .from("products")
      .insert({ ...row, published_at: d.status === "active" ? new Date().toISOString() : null })
      .select("id")
      .single();
    if (error) return duplicate(error.code);

    const { price, stock } = parsed.data as z.infer<typeof newProductSchema>;
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: created.id,
        sku: makeSku(skuPrefixFromSlug(slug), [suffix()]),
        title: "Default",
        price_cents: price,
        stock_quantity: 0,
      })
      .select("id")
      .single();
    if (variantError) {
      await supabase.from("products").delete().eq("id", created.id);
      return errorState("The product couldn't be created. Please try again.", formData);
    }
    if (stock > 0) {
      await supabase.rpc("adjust_variant_stock", {
        p_variant_id: variant.id,
        p_change: stock,
        p_reason: "restock",
        p_note: "Opening stock",
      });
    }
    updateTag(CATALOG_TAG);
    redirect(`/admin/products/${created.id}?created=1`);
  }

  if (!z.uuid().safeParse(productId).success) return errorState("Unknown product.");
  const { data: current } = await supabase
    .from("products")
    .select("published_at")
    .eq("id", productId)
    .maybeSingle();
  if (!current) return errorState("Unknown product.");
  const { error } = await supabase
    .from("products")
    .update({
      ...row,
      ...(d.status === "active" && !current.published_at
        ? { published_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", productId);
  if (error) return duplicate(error.code);
  changed();
  return { status: "success", message: "Product saved." };
}

/**
 * Syncs options and values with the editor text, then makes sure there is
 * exactly one active variant per combination: new combinations get a variant
 * (at the current base price, no stock), and variants whose combination no
 * longer exists are switched off rather than deleted, so order history keeps them.
 */
export async function saveProductOptions(
  productId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return errorState(NOT_ADMIN);
  if (!z.uuid().safeParse(productId).success) return errorState("Unknown product.");
  const parsed = parseOptionsText(String(formData.get("options") ?? ""));
  if (!parsed.ok) return errorState(parsed.error, formData);

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select(
      "slug, options:product_options(id, name, values:product_option_values(id, value)), variants:product_variants(price_cents, is_active)",
    )
    .eq("id", productId)
    .maybeSingle();
  if (!product) return errorState("Unknown product.");

  const keptOptionIds: string[] = [];
  const valueIdsPerOption: { id: string; value: string }[][] = [];
  for (const [i, option] of parsed.options.entries()) {
    const existing = product.options.find(
      (o) => o.name.toLowerCase() === option.name.toLowerCase(),
    );
    let optionId = existing?.id;
    if (optionId) {
      await supabase
        .from("product_options")
        .update({ name: option.name, position: i })
        .eq("id", optionId);
    } else {
      const { data, error } = await supabase
        .from("product_options")
        .insert({ product_id: productId, name: option.name, position: i })
        .select("id")
        .single();
      if (error) return errorState("The options couldn't be saved.", formData);
      optionId = data.id;
    }
    keptOptionIds.push(optionId);

    const ids: { id: string; value: string }[] = [];
    for (const [j, value] of option.values.entries()) {
      const match = existing?.values.find(
        (v) => v.value.toLowerCase() === value.value.toLowerCase(),
      );
      if (match) {
        await supabase
          .from("product_option_values")
          .update({ value: value.value, swatch_hex: value.swatch, position: j })
          .eq("id", match.id);
        ids.push({ id: match.id, value: value.value });
      } else {
        const { data, error } = await supabase
          .from("product_option_values")
          .insert({
            option_id: optionId,
            value: value.value,
            swatch_hex: value.swatch,
            position: j,
          })
          .select("id")
          .single();
        if (error) return errorState("The option values couldn't be saved.", formData);
        ids.push({ id: data.id, value: value.value });
      }
    }
    const removed = (existing?.values ?? []).filter((v) => !ids.some((k) => k.id === v.id));
    if (removed.length) {
      await supabase
        .from("product_option_values")
        .delete()
        .in(
          "id",
          removed.map((v) => v.id),
        );
    }
    valueIdsPerOption.push(ids);
  }
  const removedOptions = product.options.filter((o) => !keptOptionIds.includes(o.id));
  if (removedOptions.length) {
    await supabase
      .from("product_options")
      .delete()
      .in(
        "id",
        removedOptions.map((o) => o.id),
      );
  }

  // Re-read variants now that removed values have cascaded out of their combinations.
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, position, options:product_variant_options(option_value_id)")
    .eq("product_id", productId);
  const keyOf = (ids: string[]) => [...ids].sort().join("|");
  const byKey = new Map(
    (variants ?? []).map((v) => [keyOf(v.options.map((o) => o.option_value_id)), v]),
  );
  const activePrices = product.variants.filter((v) => v.is_active).map((v) => v.price_cents);
  const basePrice = activePrices.length ? Math.min(...activePrices) : 0;
  const prefix = skuPrefixFromSlug(product.slug);
  let position = Math.max(-1, ...(variants ?? []).map((v) => v.position)) + 1;

  const matched = new Set<string>();
  for (const combo of cartesian(valueIdsPerOption)) {
    const key = keyOf(combo.map((c) => c.id));
    const title = combo.length ? combo.map((c) => c.value).join(" / ") : "Default";
    const existing = byKey.get(key);
    if (existing) {
      matched.add(existing.id);
      await supabase
        .from("product_variants")
        .update({ is_active: true, title })
        .eq("id", existing.id);
      continue;
    }
    const { data: created, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        sku: makeSku(prefix, [...combo.map((c) => c.value), suffix()]),
        title,
        price_cents: basePrice,
        stock_quantity: 0,
        position: position++,
      })
      .select("id")
      .single();
    if (error) return errorState("A variant couldn't be created. Please try again.", formData);
    if (combo.length) {
      await supabase
        .from("product_variant_options")
        .insert(combo.map((c) => ({ variant_id: created.id, option_value_id: c.id })));
    }
    matched.add(created.id);
  }
  const unmatched = (variants ?? []).filter((v) => !matched.has(v.id)).map((v) => v.id);
  if (unmatched.length) {
    await supabase.from("product_variants").update({ is_active: false }).in("id", unmatched);
  }

  changed();
  return { status: "success", message: "Options saved. Check the prices of any new variants." };
}

/** Saves the variant table. Stock edits go through adjust_variant_stock, so they're logged. */
export async function saveVariants(
  productId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return errorState(NOT_ADMIN);
  if (!z.uuid().safeParse(productId).success) return errorState("Unknown product.");
  const supabase = await createClient();
  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase.from("product_variants").select("id, stock_quantity").eq("product_id", productId),
    supabase.from("product_images").select("id").eq("product_id", productId),
  ]);
  if (!variants) return errorState("Unknown product.");

  const fieldErrors: Record<string, string> = {};
  const updates = variants.map((v) => {
    const get = (name: string) => String(formData.get(`${name}.${v.id}`) ?? "").trim();
    const price = parseMoneyToCents(get("price"));
    const compareRaw = get("compare");
    const compare = compareRaw ? parseMoneyToCents(compareRaw) : null;
    const sku = get("sku").toUpperCase();
    const stock = Number(get("stock"));
    const threshold = Number(get("threshold"));
    const image = get("image");
    if (price === null) fieldErrors[`price.${v.id}`] = "Invalid price";
    if (compareRaw && (compare === null || (price !== null && compare <= price))) {
      fieldErrors[`compare.${v.id}`] = "Must be higher than the price";
    }
    if (!/^[A-Z0-9-]{1,64}$/.test(sku)) fieldErrors[`sku.${v.id}`] = "Letters, numbers, dashes";
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000)
      fieldErrors[`stock.${v.id}`] = "0 or more";
    if (!Number.isInteger(threshold) || threshold < 0 || threshold > 10000) {
      fieldErrors[`threshold.${v.id}`] = "0 or more";
    }
    return {
      id: v.id,
      stockDelta: stock - v.stock_quantity,
      row: {
        price_cents: price ?? 0,
        compare_at_price_cents: compare,
        sku,
        low_stock_threshold: threshold,
        is_active: formData.get(`active.${v.id}`) === "on",
        image_id: images?.some((i) => i.id === image) ? image : null,
      },
    };
  });
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  for (const update of updates) {
    const { error } = await supabase
      .from("product_variants")
      .update(update.row)
      .eq("id", update.id);
    if (error) {
      return errorState(
        error.code === "23505"
          ? `SKU ${update.row.sku} is already used by another variant.`
          : "The variants couldn't be saved.",
      );
    }
    if (update.stockDelta !== 0) {
      const { error: stockError } = await supabase.rpc("adjust_variant_stock", {
        p_variant_id: update.id,
        p_change: update.stockDelta,
        p_reason: "adjustment",
        p_note: "Edited in the product editor",
      });
      if (stockError) return errorState(`Stock for ${update.row.sku} couldn't be changed.`);
    }
  }
  changed();
  return { status: "success", message: "Variants saved." };
}

export async function uploadProductImage(
  productId: string,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  if (!(await requireAdmin())) return { ok: false, message: NOT_ADMIN };
  if (!z.uuid().safeParse(productId).success) return { ok: false, message: "Unknown product." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a photo." };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, message: `${file.name}: use JPEG, PNG, WebP or AVIF.` };
  if (file.size > MAX_IMAGE_BYTES)
    return { ok: false, message: `${file.name} is larger than 3.5 MB.` };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("slug, name, images:product_images(position)")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { ok: false, message: "Unknown product." };

  const path = `products/${product.slug}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (uploadError) return { ok: false, message: `${file.name} couldn't be uploaded.` };

  const position = Math.max(-1, ...product.images.map((i) => i.position)) + 1;
  const { error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, storage_path: path, alt_text: product.name, position });
  if (error) {
    await supabase.storage.from("product-images").remove([path]);
    return { ok: false, message: `${file.name} couldn't be saved.` };
  }
  changed();
  return { ok: true, message: `${file.name} uploaded.` };
}

export async function saveImageAlt(
  imageId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return errorState(NOT_ADMIN);
  const alt = String(formData.get("alt") ?? "")
    .trim()
    .slice(0, 200);
  if (!z.uuid().safeParse(imageId).success) return errorState("Unknown photo.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_images")
    .update({ alt_text: alt })
    .eq("id", imageId);
  if (error) return errorState("The description couldn't be saved.");
  changed();
  return { status: "success", message: "Saved." };
}

/** Swaps a photo with its neighbour; the first photo is the one shown on product cards. */
export async function moveImage(imageId: string, direction: -1 | 1) {
  if (!(await requireAdmin())) return;
  if (!z.uuid().safeParse(imageId).success) return;
  const supabase = await createClient();
  const { data: image } = await supabase
    .from("product_images")
    .select("id, product_id")
    .eq("id", imageId)
    .maybeSingle();
  if (!image) return;
  const { data: siblings } = await supabase
    .from("product_images")
    .select("id, position")
    .eq("product_id", image.product_id)
    .order("position");
  const list = siblings ?? [];
  const index = list.findIndex((i) => i.id === imageId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  for (const [position, item] of list.entries()) {
    await supabase.from("product_images").update({ position }).eq("id", item.id);
  }
  changed();
}

export async function deleteImage(imageId: string) {
  if (!(await requireAdmin())) return;
  if (!z.uuid().safeParse(imageId).success) return;
  const supabase = await createClient();
  const { data: image } = await supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .maybeSingle();
  if (!image) return;
  await supabase.from("product_images").delete().eq("id", imageId);
  // Keep the file if another row still points at it (e.g. seed data shared between products).
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("storage_path", image.storage_path);
  if (!count) await supabase.storage.from("product-images").remove([image.storage_path]);
  changed();
}
