"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui";

export function ModerateButtons({
  approve,
  reject,
  status,
}: {
  approve: () => Promise<void>;
  reject: () => Promise<void>;
  status: "pending" | "approved" | "rejected";
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      {status !== "approved" && (
        <Button size="sm" loading={pending} onClick={() => startTransition(approve)}>
          <Check className="size-4" aria-hidden="true" /> Approve
        </Button>
      )}
      {status !== "rejected" && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => startTransition(reject)}
        >
          <X className="size-4" aria-hidden="true" /> Reject
        </Button>
      )}
    </div>
  );
}
