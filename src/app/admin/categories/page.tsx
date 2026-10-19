import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminContent } from "@/components/admin/admin-ui";
import { Alert, Badge, Skeleton } from "@/components/ui";
import { saveCategory, uploadCategoryImage } from "@/features/admin/categories/actions";
import { CategoryForm, CategoryImageForm } from "@/features/admin/categories/category-forms";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";

export const metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader title="Categories" description="The rooms shoppers browse by." />
      <AdminContent>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <Categories searchParams={searchParams} />
        </Suspense>
      </AdminContent>
    </>
  );
}

async function Categories({ searchParams }: Pick<PageProps<"/admin/categories">, "searchParams">) {
  if (!(await requireAdmin())) return null;
  const params = await searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_path, sort_order, is_active, products(count)")
    .order("sort_order")
    .order("name");
  const list = categories ?? [];
  const editing =
    typeof params.edit === "string" ? list.find((c) => c.id === params.edit) : undefined;

  return (
    <>
      {params.saved === "1" && <Alert tone="success">Category saved.</Alert>}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => {
          const url = publicStorageUrl("category-images", c.image_path);
          const count = (c.products as unknown as { count: number }[])[0]?.count ?? 0;
          return (
            <li key={c.id} className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="relative aspect-[3/1] bg-subtle">
                {url && <Image src={url} alt="" fill sizes="400px" className="object-cover" />}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{c.name}</p>
                  {!c.is_active && <Badge tone="neutral">Hidden</Badge>}
                </div>
                <p className="text-xs text-ink-muted">
                  /categories/{c.slug} · {count} {count === 1 ? "product" : "products"} · order{" "}
                  {c.sort_order}
                </p>
                <CategoryImageForm action={uploadCategoryImage.bind(null, c.id)} />
                <Link
                  href={`/admin/categories?edit=${c.id}#category-form`}
                  className="inline-block text-sm underline underline-offset-4"
                >
                  Edit details
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      <div id="category-form" className="scroll-mt-6">
        <AdminCard
          title={editing ? `Edit ${editing.name}` : "New category"}
          actions={
            editing ? (
              <Link href="/admin/categories" className="text-sm text-ink-muted underline">
                Cancel
              </Link>
            ) : undefined
          }
        >
          <CategoryForm
            key={editing?.id ?? "new"}
            action={saveCategory.bind(null, editing?.id ?? null)}
            submitLabel={editing ? "Save changes" : "Create category"}
            defaults={{
              name: editing?.name ?? "",
              slug: editing?.slug ?? "",
              description: editing?.description ?? "",
              sortOrder: editing?.sort_order ?? list.length,
              active: editing?.is_active ?? true,
            }}
          />
        </AdminCard>
      </div>
    </>
  );
}
