import { BadgeCheck, MessageSquareText } from "lucide-react";
import type { ProductReview } from "../queries";
import { RatingStars } from "./rating-stars";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export function ProductReviews({
  reviews,
  rating,
  count,
}: {
  reviews: ProductReview[];
  rating: number;
  count: number;
}) {
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    total: reviews.filter((r) => r.rating === stars).length,
  }));

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-28">
      <h2 id="reviews-heading" className="text-3xl font-light">
        Reviews
      </h2>

      {count === 0 ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-ink-muted">
          <MessageSquareText className="size-5 text-ink-faint" aria-hidden="true" />
          No reviews yet. Customers who buy this piece can review it from their orders.
        </div>
      ) : (
        <div className="mt-8 grid gap-12 lg:grid-cols-[16rem_1fr]">
          <div>
            <p className="font-display text-5xl font-light">{rating.toFixed(1)}</p>
            <RatingStars rating={rating} size="md" className="mt-2" />
            <p className="mt-2 text-sm text-ink-muted">
              Based on {count} review{count === 1 ? "" : "s"}
            </p>
            <dl className="mt-6 space-y-2">
              {breakdown.map(({ stars, total }) => (
                <div key={stars} className="flex items-center gap-3 text-xs text-ink-muted">
                  <dt className="w-10">{stars} star</dt>
                  <dd className="flex flex-1 items-center gap-3">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${reviews.length ? (total / reviews.length) * 100 : 0}%` }}
                      />
                    </span>
                    <span className="w-4 text-right tabular-nums">{total}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <ul className="divide-y divide-line">
            {reviews.map((review) => (
              <li key={review.id} className="py-6 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <RatingStars rating={review.rating} />
                  {review.title && (
                    <h3 className="font-sans text-sm font-medium">{review.title}</h3>
                  )}
                </div>
                {review.body && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{review.body}</p>
                )}
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                  <span className="font-medium text-ink-soft">{review.author}</span>
                  <time dateTime={review.createdAt}>
                    {dateFormat.format(new Date(review.createdAt))}
                  </time>
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 text-success">
                      <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified purchase
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
