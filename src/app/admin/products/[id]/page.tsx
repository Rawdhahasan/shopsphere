import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminContent } from "@/components/admin/admin-ui";
import { Alert, Skeleton } from "@/components/ui";
import {
  deleteImage,
  moveImage,
  saveImageAlt,
  saveProduct,
  saveProductOptions,
  saveVariants,
  uploadProductImage,
} from "@/features/admin/products/actions";
import { formatOptionsText, formatSpecifications } from "@/features/admin/products/editor";
import { ImageManager } from "@/features/admin/products/image-manager";
import { ProductForm } from "@/features/admin/products/product-form";
import { getAdminProduct, listCategoryChoices } from "@/features/admin/products/queries";
import { OptionsForm, VariantsForm } from "@/features/admin/products/variant-forms";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = { title: "Edit product" };

const cents = (value: number | null) => (value === null ? "" : (value / 100).toFixed(2));

export default async function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/products/[id]">) {
  if (!(await requireAdmin())) return null;
  return (
    <Suspense fallback={<Skeleton className="m-10 h-96" />}>
      <Editor params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Editor({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  const [product, categories] = await Promise.all([getAdminProduct(id), listCategoryChoices()]);
  if (!product) notFound();

  const activeVariants = product.variants.filter((v) => v.is_active);
  const imageChoices = product.images.map((image, i) => ({
    id: image.id,
    label: `Photo ${i + 1}`,
  }));

  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={`/${product.slug} · ${activeVariants.length} active variant${activeVariants.length === 1 ? "" : "s"} · ${product.total_stock} in stock`}
        actions={
          <>
            {product.status === "active" && (
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
              >
                View in store <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            )}
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> All products
            </Link>
          </>
        }
      />
      <AdminContent>
        {created === "1" && (
          <Alert tone="success" title="Product created">
            Add photos and options below. It stays hidden while its status is Draft.
          </Alert>
        )}
        {product.status === "active" && activeVariants.length === 0 && (
          <Alert tone="warning">
            This product is active but has no variant for sale, so shoppers can’t buy it.
          </Alert>
        )}
        <AdminCard title="Photos">
          <ImageManager
            images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt_text }))}
            upload={uploadProductImage.bind(null, product.id)}
            saveAlt={saveImageAlt}
            move={moveImage}
            remove={deleteImage}
          />
        </AdminCard>
        <AdminCard title="Details">
          <ProductForm
            isNew={false}
            action={saveProduct.bind(null, product.id)}
            categories={categories}
            defaults={{
              name: product.name,
              slug: product.slug,
              categoryId: product.category_id ?? "",
              status: product.status,
              featured: product.is_featured,
              brand: product.brand ?? "",
              shortDescription: product.short_description ?? "",
              description: product.description ?? "",
              specifications: formatSpecifications(product.specifications),
              seoTitle: product.seo_title ?? "",
              seoDescription: product.seo_description ?? "",
            }}
          />
        </AdminCard>
        <AdminCard title="Options">
          <OptionsForm
            action={saveProductOptions.bind(null, product.id)}
            defaultText={formatOptionsText(
              product.options.map((o) => ({
                name: o.name,
                values: o.values.map((v) => ({ value: v.value, swatch: v.swatch_hex })),
              })),
            )}
          />
        </AdminCard>
        <AdminCard title="Variants">
          <VariantsForm
            action={saveVariants.bind(null, product.id)}
            images={imageChoices}
            variants={product.variants.map((v) => ({
              id: v.id,
              title: v.title,
              sku: v.sku,
              price: cents(v.price_cents),
              compare: cents(v.compare_at_price_cents),
              stock: v.stock_quantity,
              threshold: v.low_stock_threshold,
              active: v.is_active,
              imageId: v.image_id ?? "",
            }))}
          />
        </AdminCard>
      </AdminContent>
    </>
  );
}
