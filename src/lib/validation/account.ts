import { z } from "zod";
import { COUNTRY_CODES } from "@/config/countries";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .optional()
    .transform((value) => (value ? value : null));

const requiredText = (max: number, message: string) =>
  z.string({ error: message }).trim().min(1, message).max(max, `Use at most ${max} characters.`);

const phoneField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || /^\+?[0-9 ()-]{6,32}$/.test(value), {
    message: "Enter a valid phone number, e.g. +1 503 555 0100.",
  });

export const profileSchema = z.object({
  fullName: requiredText(120, "Enter your name."),
  phone: phoneField,
});

export const addressSchema = z.object({
  label: optionalText(40, "Label"),
  fullName: requiredText(120, "Enter the recipient's name."),
  phone: phoneField,
  line1: requiredText(200, "Enter the street address."),
  line2: optionalText(200, "Apartment, suite, etc."),
  city: requiredText(100, "Enter the city."),
  region: optionalText(100, "State / region"),
  postalCode: requiredText(20, "Enter the postal code."),
  countryCode: z.enum(COUNTRY_CODES, { error: "Choose a country." }),
  // Unchecked checkboxes aren't submitted at all.
  isDefault: z
    .literal("on")
    .optional()
    .transform((value) => value === "on"),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const idSchema = z.uuid({ error: "Invalid id." });
