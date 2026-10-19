"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { slugify } from "@/features/admin/products/editor";
import { requireAdmin } from "@/lib/auth/session";
import { errorState, parseForm, type FormState } from "@/lib/forms/form-state";
import { createClient } from "@/lib/supabase/server";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .refine((v) => v === "" || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), {
      message: "Use lowercase letters, numbers and single dashes.",
    }),
  description: z
    .string()
    .trim()
    .max(1000)
    .transform((v) => v || null),
  sortOrder: z.coerce.number().int("Use a whole number.").min(0).max(1000),
  active: z.literal("on").optional().transform(Boolean),
});

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function saveCategory(
  categoryId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return errorState("Only admins can manage categories.");
  const parsed = parseForm(categorySchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  const row = {
    name: d.name,
    slug: d.slug || slugify(d.name),
    description: d.description,
    sort_order: d.sortOrder,
    is_active: d.active,
  };
  const supabase = await createClient();
  const { error } =
    categoryId && z.uuid().safeParse(categoryId).success
      ? await supabase.from("categories").update(row).eq("id", categoryId)
      : await supabase.from("categories").insert(row);
  if (error) {
    return errorState(
      error.code === "23505"
        ? "Another category already uses that URL slug."
        : "The category couldn't be saved.",
      formData,
    );
  }
  updateTag(CATALOG_TAG);
  refresh();
  redirect("/admin/categories?saved=1");
}

/** Replaces a category's header photo (category-images bucket, admin-only by RLS). */
export async function uploadCategoryImage(
  categoryId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return errorState("Only admins can manage categories.");
  if (!z.uuid().safeParse(categoryId).success) return errorState("Unknown category.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return errorState("Choose a photo.");
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return errorState("Use a JPEG, PNG or WebP photo.");
  if (file.size > 3.5 * 1024 * 1024) return errorState("The photo must be 3.5 MB or smaller.");

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("slug, image_path")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category) return errorState("Unknown category.");
  const path = `categories/${category.slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("category-images")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) return errorState("The photo couldn't be uploaded.");
  await supabase.from("categories").update({ image_path: path }).eq("id", categoryId);
  // Seed photos are shared with the home page, so only remove photos uploaded here before.
  if (category.image_path && /-\d{13}\.\w+$/.test(category.image_path)) {
    await supabase.storage.from("category-images").remove([category.image_path]);
  }
  updateTag(CATALOG_TAG);
  refresh();
  return { status: "success", message: "Photo updated." };
}
