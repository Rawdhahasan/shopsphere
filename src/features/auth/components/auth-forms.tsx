"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FormAlert } from "@/components/forms/form-alert";
import { Button, FormField, Input } from "@/components/ui";
import { PasswordInput } from "@/components/ui/password-input";
import { initialFormState, type FormState } from "@/lib/forms/form-state";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation/auth";

export type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

const passwordHint = `At least ${PASSWORD_MIN_LENGTH} characters, with upper- and lower-case letters and a number.`;

export function LoginForm({
  action,
  next,
  notice,
}: {
  action: FormAction;
  next?: string;
  notice?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {notice && state.status === "idle" && (
        <FormAlert state={{ status: "error", message: notice }} />
      )}
      <FormAlert state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <FormField label="Email" error={state.fieldErrors?.email}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
        />
      </FormField>
      <FormField label="Password" error={state.fieldErrors?.password}>
        <PasswordInput name="password" autoComplete="current-password" required />
      </FormField>
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}

export function RegisterForm({ action, next }: { action: FormAction; next?: string }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);

  if (state.status === "success") return <FormAlert state={state} />;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormAlert state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <FormField label="Full name" error={state.fieldErrors?.fullName}>
        <Input name="fullName" autoComplete="name" required defaultValue={state.values?.fullName} />
      </FormField>
      <FormField label="Email" error={state.fieldErrors?.email}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
        />
      </FormField>
      <FormField label="Password" hint={passwordHint} error={state.fieldErrors?.password}>
        <PasswordInput
          name="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
        />
      </FormField>
      <FormField label="Confirm password" error={state.fieldErrors?.confirmPassword}>
        <PasswordInput name="confirmPassword" autoComplete="new-password" required />
      </FormField>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Create account
      </Button>
    </form>
  );
}

export function ForgotPasswordForm({ action }: { action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);

  if (state.status === "success") return <FormAlert state={state} />;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormAlert state={state} />
      <FormField label="Email" error={state.fieldErrors?.email}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
        />
      </FormField>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}

export function UpdatePasswordForm({ action }: { action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  return (
    // `key` resets the inputs after a successful change.
    <form
      key={state.status === "success" ? "done" : "editing"}
      action={formAction}
      className="max-w-md space-y-5"
      noValidate
    >
      <FormAlert state={state} />
      <FormField label="New password" hint={passwordHint} error={state.fieldErrors?.password}>
        <PasswordInput
          name="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
        />
      </FormField>
      <FormField label="Confirm new password" error={state.fieldErrors?.confirmPassword}>
        <PasswordInput name="confirmPassword" autoComplete="new-password" required />
      </FormField>
      <Button type="submit" loading={pending}>
        Update password
      </Button>
    </form>
  );
}
