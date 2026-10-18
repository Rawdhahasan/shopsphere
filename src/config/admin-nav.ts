import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Star,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { label: string; href: string; icon: LucideIcon };

export const adminNav: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Inventory", href: "/admin/inventory", icon: Boxes },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Discounts", href: "/admin/discounts", icon: TicketPercent },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  { title: "Store", items: [{ label: "Settings", href: "/admin/settings", icon: Settings }] },
];
