"use client";

import { Trash2 } from "lucide-react";

/** Submits the surrounding delete form only after the user confirms. */
export function DeleteAddressButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(`Delete ${label}? This can't be undone.`)) event.preventDefault();
      }}
      className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-danger"
    >
      <Trash2 className="size-4" aria-hidden="true" />
      Delete
    </button>
  );
}
