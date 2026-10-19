import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminContent } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";
import { saveProduct } from "@/features/admin/products/actions";
import { ProductForm } from "@/features/admin/products/product-form";
import { listCategoryChoices } from "@/features/admin/products/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader
        title="New product"
        description="Start with the basics. Photos, options and variants come next."
      />
      <AdminContent>
        <AdminCard>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <NewProductForm />
          </Suspense>
        </AdminCard>
      </AdminContent>
    </>
  );
}

async function NewProductForm() {
  const categories = await listCategoryChoices();
  return (
    <ProductForm
      isNew
      action={saveProduct.bind(null, null)}
      categories={categories}
      defaults={{
        name: "",
        slug: "",
        categoryId: "",
        status: "draft",
        featured: false,
        brand: "ShopSphere Studio",
        shortDescription: "",
        description: "",
        specifications: "",
        seoTitle: "",
        seoDescription: "",
      }}
    />
  );
}
