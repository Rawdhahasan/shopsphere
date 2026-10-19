import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { publicStorageUrl } from "@/lib/supabase/storage";

const image = publicStorageUrl("category-images", "categories/living.webp");

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <main id="main" className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <Logo />
        <div className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-sm animate-fade-up">{children}</div>
        </div>
        <p className="text-xs text-ink-faint">
          Created by Rawdha Hasan · Payments run in Stripe test mode. No real charges are made.
        </p>
      </main>
      <aside aria-label="About ShopSphere" className="relative hidden bg-sand lg:block">
        {image && (
          <Image
            src={image}
            alt="A calm living room with an ivory two-seater sofa and linen cushions"
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-x-10 bottom-10 rounded-lg bg-canvas/85 p-6 backdrop-blur-md">
          <p className="font-display text-2xl font-light">Objects for considered living</p>
          <p className="mt-2 text-sm text-ink-muted">
            Save addresses, track orders and keep a wishlist of the pieces you love.
          </p>
        </div>
      </aside>
    </div>
  );
}
