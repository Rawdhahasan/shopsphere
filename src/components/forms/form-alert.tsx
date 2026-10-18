import { Alert } from "@/components/ui";
import type { FormState } from "@/lib/forms/form-state";

/** Banner for a form's overall success or error message. */
export function FormAlert({ state }: { state: FormState }) {
  if (!state.message || state.status === "idle") return null;
  return <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>;
}
