import { z } from "zod";

/**
 * Form schemas for authentication. They run on the server inside Server
 * Actions; the same rules are enforced again by Supabase Auth.
 */

export const PASSWORD_MIN_LENGTH = 10;
/** bcrypt only uses the first 72 bytes, so longer passwords give a false sense of strength. */
export const PASSWORD_MAX_LENGTH = 72;

export const emailField = z
  .string({ error: "Enter your email address." })
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .max(254, "That email address is too long.")
  .pipe(z.email({ error: "Enter a valid email address." }));

/** Matches the hosted project's rule: 10+ characters with lower- and upper-case letters and a digit. */
export const newPasswordField = z
  .string({ error: "Choose a password." })
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`)
  .regex(/[a-z]/, "Include a lower-case letter.")
  .regex(/[A-Z]/, "Include an upper-case letter.")
  .regex(/[0-9]/, "Include a number.");

const fullNameField = z
  .string({ error: "Enter your name." })
  .trim()
  .min(1, "Enter your name.")
  .max(120, "Use at most 120 characters.");

export const signInSchema = z.object({
  email: emailField,
  password: z.string({ error: "Enter your password." }).min(1, "Enter your password."),
  next: z.string().optional(),
});

export const signUpSchema = z
  .object({
    fullName: fullNameField,
    email: emailField,
    password: newPasswordField,
    confirmPassword: z.string({ error: "Confirm your password." }),
    next: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords don't match.",
  });

export const passwordResetRequestSchema = z.object({ email: emailField });

export const updatePasswordSchema = z
  .object({
    password: newPasswordField,
    confirmPassword: z.string({ error: "Confirm your new password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords don't match.",
  });
