/**
 * Static site configuration: brand copy and navigation structure.
 * Product and category *data* always comes from Supabase; from Phase 4 the
 * category links are loaded from the database too.
 */
export const siteConfig = {
  name: "ShopSphere",
  tagline: "Objects for considered living",
  description:
    "ShopSphere curates modern furniture, tableware, textiles and decor made to be lived with.",
  announcement: "Complimentary shipping on orders over $150",
  storeNav: [
    { label: "Shop all", href: "/products" },
    { label: "Living", href: "/categories/living" },
    { label: "Kitchen & Dining", href: "/categories/kitchen-dining" },
    { label: "Bedroom", href: "/categories/bedroom" },
    { label: "Bath", href: "/categories/bath" },
    { label: "Decor", href: "/categories/decor" },
  ],
  footerNav: [
    {
      title: "Shop",
      links: [
        { label: "New arrivals", href: "/products?sort=newest" },
        { label: "Best sellers", href: "/products?sort=popular" },
        { label: "All products", href: "/products" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "Track an order", href: "/account/orders" },
        { label: "Shipping & returns", href: "/help/shipping" },
        { label: "Contact", href: "/help/contact" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Sign in", href: "/login" },
        { label: "Create account", href: "/register" },
        { label: "Wishlist", href: "/wishlist" },
      ],
    },
  ],
} as const;
