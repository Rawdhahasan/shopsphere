import type { BadgeTone } from "@/components/ui";
import type { Database } from "@/types/database";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  pending_payment: { label: "Awaiting payment", tone: "warning" },
  paid: { label: "Paid", tone: "accent" },
  processing: { label: "Processing", tone: "accent" },
  shipped: { label: "Shipped", tone: "neutral" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const formatOrderDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
