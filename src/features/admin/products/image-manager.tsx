"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { initialFormState, type FormState } from "@/lib/forms/form-state";

type Photo = { id: string; url: string | null; alt: string };

export function ImageManager({
  images,
  upload,
  saveAlt,
  move,
  remove,
}: {
  images: Photo[];
  upload: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
  saveAlt: (imageId: string, prev: FormState, formData: FormData) => Promise<FormState>;
  move: (imageId: string, direction: -1 | 1) => Promise<void>;
  remove: (imageId: string) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<{ ok: boolean; message: string }[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const results: { ok: boolean; message: string }[] = [];
    for (const [index, file] of [...files].entries()) {
      setUploading(`Uploading ${index + 1} of ${files.length}…`);
      const data = new FormData();
      data.set("file", file);
      results.push(await upload(data));
    }
    setUploading(null);
    setMessages(results);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      {images.length === 0 && <p className="text-sm text-ink-muted">No photos yet.</p>}
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {images.map((image, index) => (
          <li key={image.id} className="overflow-hidden rounded-md border border-line">
            <div className="relative aspect-[4/5] bg-subtle">
              {image.url && (
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              )}
              {index === 0 && (
                <span className="absolute top-2 left-2 rounded-full bg-ink px-2 py-0.5 text-xs text-canvas">
                  Main photo
                </span>
              )}
            </div>
            <div className="space-y-2 p-2">
              <AltForm action={saveAlt.bind(null, image.id)} alt={image.alt} />
              <div className="flex justify-between">
                <div className="flex gap-1">
                  <IconButton
                    label="Move earlier"
                    disabled={pending || index === 0}
                    onClick={() => startTransition(() => move(image.id, -1))}
                  >
                    <ArrowLeft className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Move later"
                    disabled={pending || index === images.length - 1}
                    onClick={() => startTransition(() => move(image.id, 1))}
                  >
                    <ArrowRight className="size-4" />
                  </IconButton>
                </div>
                <IconButton
                  label="Delete photo"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm("Delete this photo?"))
                      startTransition(() => remove(image.id));
                  }}
                >
                  <Trash2 className="size-4 text-danger" />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          id="photo-upload"
          onChange={(e) => uploadFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={Boolean(uploading)}
        >
          {uploading ? (
            <Spinner className="size-4" />
          ) : (
            <ImagePlus className="size-4" aria-hidden="true" />
          )}
          {uploading ?? "Upload photos"}
        </Button>
        <span className="text-xs text-ink-muted">
          JPEG, PNG, WebP or AVIF, up to 3.5 MB each. Portrait (4:5) looks best.
        </span>
      </div>
      {messages.length > 0 && (
        <ul className="space-y-1 text-sm" aria-live="polite">
          {messages.map((m, i) => (
            <li key={i} className={m.ok ? "text-success" : "text-danger"}>
              {m.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AltForm({
  action,
  alt,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  alt: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  return (
    <form action={formAction} className="flex gap-1">
      <label className="flex-1">
        <span className="sr-only">Photo description</span>
        <input
          name="alt"
          defaultValue={alt}
          maxLength={200}
          placeholder="Describe the photo"
          className="h-8 w-full rounded border border-line-strong bg-surface px-2 text-xs"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-line-strong px-2 text-xs hover:border-ink"
      >
        {state.status === "success" && !pending ? "Saved" : "Save"}
      </button>
    </form>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded hover:bg-subtle disabled:opacity-30"
    >
      {children}
    </button>
  );
}
