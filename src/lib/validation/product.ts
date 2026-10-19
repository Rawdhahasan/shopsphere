import { z } from "zod";
import { parseMoneyToCents } from "@/lib/money";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => v || null);

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a product name.")
    .max(160, "Keep the name under 160 characters."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .refine((v) => v === "" || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), {
      message: "Use lowercase letters, numbers and single dashes.",
    }),
  categoryId: z.union([z.uuid(), z.literal("")]).transform((v) => v || null),
  status: z.enum(["draft", "active", "archived"]),
  featured: z.literal("on").optional().transform(Boolean),
  brand: optionalText(80, "Keep the brand under 80 characters."),
  shortDescription: optionalText(300, "Keep the summary under 300 characters."),
  description: optionalText(10000, "Keep the description under 10,000 characters."),
  specifications: z.string().max(5000).default(""),
  seoTitle: optionalText(70, "Search titles should be 70 characters or fewer."),
  seoDescription: optionalText(160, "Search descriptions should be 160 characters or fewer."),
});

export const moneyField = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const cents = parseMoneyToCents(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: `Enter a ${label} like 49 or 49.95.` });
        return z.NEVER;
      }
      return cents;
    });

export const newProductSchema = productSchema.extend({
  price: moneyField("price"),
  stock: z.coerce
    .number()
    .int("Use a whole number.")
    .min(0, "Stock can't be negative.")
    .max(100000),
});

export type ProductInput = z.infer<typeof productSchema>;
