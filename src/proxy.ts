import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static files, images and the Stripe webhook (it authenticates with a signature, not cookies).
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
