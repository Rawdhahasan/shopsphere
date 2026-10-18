"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CatalogImage } from "../queries";
import {
  choiceState,
  findVariant,
  initialSelection,
  savingPercent,
  selectValue,
  stockStatus,
  type ProductOption,
  type ProductVariant,
  type Selection,
} from "../variants";
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import { Price } from "./price";

/**
 * Gallery and purchase panel. They share the variant selection: choosing a
 * variant with its own photo switches the gallery to it.
 */
export function ProductView({
  name,
  images,
  options,
  variants,
  header,
  details,
}: {
  name: string;
  images: CatalogImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  /** Brand, title and rating, rendered on the server. */
  header: ReactNode;
  /** Short description, shipping notes and so on. */
  details?: ReactNode;
}) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(variants, options));
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const variant = findVariant(variants, options, selection);
  const status = stockStatus(variant);
  const soldOut = status.kind === "sold-out";
  const maxQuantity = Math.max(1, Math.min(variant?.stock ?? 1, 10));
  const saving = variant ? savingPercent(variant.priceCents, variant.compareAtCents) : null;

  function choose(optionId: string, valueId: string) {
    const next = selectValue(variants, options, selection, optionId, valueId);
    setSelection(next);
    setQuantity(1);
    const nextVariant = findVariant(variants, options, next);
    const photo = nextVariant?.imageId ? images.findIndex((i) => i.id === nextVariant.imageId) : -1;
    if (photo >= 0) setImageIndex(photo);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
      <Gallery name={name} images={images} index={imageIndex} onIndexChange={setImageIndex} />

      <div className="lg:pt-4">
        {header}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {variant ? (
            <Price
              cents={variant.priceCents}
              compareAtCents={variant.compareAtCents}
              className="text-2xl"
            />
          ) : (
            <p className="text-ink-muted">Choose your options</p>
          )}
          {saving && (
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-strong">
              Save {saving}%
            </span>
          )}
        </div>

        {details}

        {options.map((option) => (
          <OptionPicker
            key={option.id}
            option={option}
            selected={selection[option.id]}
            stateOf={(valueId) => choiceState(variants, options, selection, option.id, valueId)}
            onChoose={(valueId) => choose(option.id, valueId)}
          />
        ))}

        <p
          className={cn(
            "mt-8 flex items-center gap-2 text-sm",
            status.kind === "sold-out" && "text-danger",
            status.kind === "low" && "text-warning",
            status.kind === "in-stock" && "text-success",
          )}
          aria-live="polite"
        >
          <span className="size-2 rounded-full bg-current" aria-hidden="true" />
          {status.label}
          {variant && options.length > 0 && (
            <span className="text-ink-faint">· {variant.title}</span>
          )}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex h-13 items-center justify-between rounded-full border border-line-strong sm:w-36">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || soldOut}
              className="flex size-12 items-center justify-center rounded-full disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
              <span className="sr-only">Quantity </span>
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity || soldOut}
              className="flex size-12 items-center justify-center rounded-full disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="flex-1">
            <AddToCartButton
              variantId={variant?.id}
              productName={name}
              quantity={quantity}
              soldOut={soldOut}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionPicker({
  option,
  selected,
  stateOf,
  onChoose,
}: {
  option: ProductOption;
  selected: string | undefined;
  stateOf: (valueId: string) => "available" | "sold-out" | "unavailable";
  onChoose: (valueId: string) => void;
}) {
  const selectedValue = option.values.find((v) => v.id === selected);
  const swatches = option.values.every((v) => v.swatchHex);

  return (
    <fieldset className="mt-8">
      <legend className="mb-3 text-sm">
        <span className="font-medium">{option.name}</span>
        {selectedValue && <span className="text-ink-muted">: {selectedValue.value}</span>}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {option.values.map((value) => {
          const state = stateOf(value.id);
          const isSelected = value.id === selected;
          const note =
            state === "sold-out"
              ? " (sold out)"
              : state === "unavailable"
                ? " (not available in this combination)"
                : "";
          return (
            <button
              key={value.id}
              type="button"
              onClick={() => onChoose(value.id)}
              aria-pressed={isSelected}
              aria-label={swatches ? `${value.value}${note}` : undefined}
              title={swatches ? value.value : undefined}
              className={cn(
                "relative transition-all",
                swatches
                  ? "size-10 rounded-full p-1 ring-1 ring-line-strong ring-offset-0"
                  : "h-11 min-w-14 rounded-full border px-5 text-sm",
                swatches && isSelected && "ring-2 ring-ink",
                !swatches &&
                  (isSelected
                    ? "border-ink bg-ink text-canvas"
                    : "border-line-strong hover:border-ink"),
                state !== "available" && !isSelected && "opacity-45",
              )}
            >
              {swatches ? (
                <span
                  className="block size-full rounded-full border border-ink/10"
                  style={{ backgroundColor: value.swatchHex ?? undefined }}
                />
              ) : (
                <>
                  {value.value}
                  {note && <span className="sr-only">{note}</span>}
                </>
              )}
              {state !== "available" && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 m-auto h-px w-[70%] rotate-[-35deg] bg-ink-muted"
                />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Gallery({
  name,
  images,
  index,
  onIndexChange,
}: {
  name: string;
  images: CatalogImage[];
  index: number;
  onIndexChange: (index: number) => void;
}) {
  const current = images[index] ?? images[0];
  const count = images.length;
  const step = useMemo(
    () => (delta: number) => onIndexChange((index + delta + count) % count),
    [index, count, onIndexChange],
  );

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-subtle text-ink-faint">
        <ImageOff className="size-8" strokeWidth={1.5} aria-label={`No photo of ${name} yet`} />
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row lg:items-start">
      {count > 1 && (
        <ul className="flex gap-3 lg:w-20 lg:flex-col" aria-label="Photos">
          {images.map((image, i) => (
            <li key={image.id} className="w-16 lg:w-full">
              <button
                type="button"
                onClick={() => onIndexChange(i)}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative block aspect-[4/5] w-full overflow-hidden rounded-md bg-subtle ring-offset-2 ring-offset-canvas transition",
                  i === index ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-lg bg-subtle">
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="animate-fade-in object-cover"
        />
        {count > 1 && (
          <div className="absolute inset-x-3 bottom-3 flex justify-between lg:hidden">
            <button
              type="button"
              onClick={() => step(-1)}
              className="flex size-10 items-center justify-center rounded-full bg-surface/90 shadow-soft"
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="flex size-10 items-center justify-center rounded-full bg-surface/90 shadow-soft"
              aria-label="Next photo"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
