import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce
    .number({ error: "Choose a star rating." })
    .int()
    .min(1, "Choose a star rating.")
    .max(5, "Choose a star rating."),
  title: z
    .string()
    .trim()
    .max(120, "Keep the title under 120 characters.")
    .transform((v) => v || null),
  body: z
    .string()
    .trim()
    .min(10, "Tell other shoppers a little more (at least 10 characters).")
    .max(5000, "Keep the review under 5,000 characters."),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
