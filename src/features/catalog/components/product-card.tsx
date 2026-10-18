import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui";
import type { ProductCardData } from "../queries";
import { savingPercent } from "../variants";
import { Price } from "./price";
import { RatingStars } from "./rating-stars";

export const CARD_IMAGE_SIZES = "(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, 46vw";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const saving = savingPercent(product.priceCents, product.compareAtCents);
  const hasRange = product.maxPriceCents > product.priceCents;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-subtle">
        {product.image ? (
          <>
            <Image
              src={product.image.url}
              alt={product.image.alt}
              fill
              sizes={CARD_IMAGE_SIZES}
              priority={priority}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            {product.hoverImage && (
              <Image
                src={product.hoverImage.url}
                alt=""
                fill
                sizes={CARD_IMAGE_SIZES}
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex size-full items-center justify-center text-ink-faint">
            <ImageOff className="size-6" strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {!product.inStock ? (
            <Badge tone="inverse">Sold out</Badge>
          ) : (
            <>
              {product.onSale && <Badge tone="accent">{saving ? `−${saving}%` : "Sale"}</Badge>}
              {product.lowStock && <Badge tone="warning">Low stock</Badge>}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-1">
        {product.categoryName && (
          <p className="text-xs tracking-wide text-ink-muted">{product.categoryName}</p>
        )}
        <h3 className="font-sans text-[0.95rem] leading-snug font-medium">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <Price
          cents={product.priceCents}
          compareAtCents={product.compareAtCents}
          from={hasRange}
          className="text-sm"
        />
        {product.reviewCount > 0 && (
          <RatingStars rating={product.rating} count={product.reviewCount} className="mt-1" />
        )}
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: ProductCardData[];
  priorityCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
