import { Suspense } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminContent, AdminEmpty, dateTimeFormat } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";
import { RatingStars } from "@/features/catalog/components/rating-stars";
import { moderateReview } from "@/features/admin/reviews/actions";
import { ModerateButtons } from "@/features/admin/reviews/moderate-buttons";
import { listReviewsForModeration } from "@/features/admin/reviews/queries";
import { requireAdmin } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Reviews" };

const TABS = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader
        title="Reviews"
        description="Approved reviews appear on product pages and count towards ratings."
      />
      <AdminContent>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ReviewList searchParams={searchParams} />
        </Suspense>
      </AdminContent>
    </>
  );
}

async function ReviewList({ searchParams }: Pick<PageProps<"/admin/reviews">, "searchParams">) {
  const { status: raw } = await searchParams;
  const result = await listReviewsForModeration(typeof raw === "string" ? raw : "pending");
  if (!result) return null;

  return (
    <>
      <nav aria-label="Review status" className="flex gap-1 border-b border-line">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "pending" ? "/admin/reviews" : `/admin/reviews?status=${tab.value}`}
            aria-current={result.status === tab.value ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm",
              result.status === tab.value
                ? "border-ink font-medium"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
            {tab.value === "pending" && result.pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-accent px-1.5 text-xs text-white">
                {result.pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
      {result.reviews.length === 0 ? (
        <AdminEmpty>
          {result.status === "pending"
            ? "No reviews waiting. All caught up."
            : "No reviews here yet."}
        </AdminEmpty>
      ) : (
        <ul className="space-y-4">
          {result.reviews.map((review) => {
            const product = review.product as { name: string; slug: string } | null;
            const author = review.author as { full_name: string | null; email: string } | null;
            return (
              <li key={review.id} className="rounded-lg border border-line bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <RatingStars rating={review.rating} />
                      {review.title && (
                        <h2 className="font-sans text-sm font-medium">{review.title}</h2>
                      )}
                    </div>
                    {review.body && (
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.body}</p>
                    )}
                    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                      <span>{author?.full_name ?? author?.email ?? "Customer"}</span>
                      {product && (
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="underline"
                        >
                          {product.name}
                        </Link>
                      )}
                      <span>{dateTimeFormat.format(new Date(review.created_at))}</span>
                      {review.is_verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-success">
                          <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified purchase
                        </span>
                      )}
                    </p>
                  </div>
                  <ModerateButtons
                    status={review.status}
                    approve={moderateReview.bind(null, review.id, "approved")}
                    reject={moderateReview.bind(null, review.id, "rejected")}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
