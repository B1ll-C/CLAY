import type { AlertStatus } from "@/lib/inventory/alerts";
import type { InventoryFilter } from "@/store/uiStore";
import type { MovementReason } from "@clay/shared";

/** FontAwesome v4 icon names used by the inventory UI. */
type FaIcon = React.ComponentProps<
  typeof import("@expo/vector-icons").FontAwesome
>["name"];

/** Pill styling + copy for each smart-alert state (badges, filter chips). */
export const ALERT_META: Record<
  AlertStatus,
  {
    label: string;
    short: string;
    icon: FaIcon;
    chipBg: string;
    chipText: string;
    iconColor: string;
  }
> = {
  out_of_stock: {
    label: "Out of stock",
    short: "Out",
    icon: "times-circle",
    chipBg: "bg-red-100",
    chipText: "text-red-700",
    iconColor: "#b91c1c",
  },
  low_stock: {
    label: "Low stock",
    short: "Low",
    icon: "exclamation-triangle",
    chipBg: "bg-amber-100",
    chipText: "text-amber-700",
    iconColor: "#b45309",
  },
  expired: {
    label: "Expired",
    short: "Expired",
    icon: "ban",
    chipBg: "bg-red-100",
    chipText: "text-red-700",
    iconColor: "#b91c1c",
  },
  expiring_soon: {
    label: "Expiring soon",
    short: "Soon",
    icon: "clock-o",
    chipBg: "bg-amber-100",
    chipText: "text-amber-700",
    iconColor: "#b45309",
  },
};

/** Filter-bar entries in display order; `all` has no alert styling. */
export const INVENTORY_FILTERS: { value: InventoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "low_stock", label: "Low" },
  { value: "expiring_soon", label: "Expiring" },
  { value: "expired", label: "Expired" },
  { value: "out_of_stock", label: "Out" },
];

/** Movement-log reason → label + signed-delta tint for the history list. */
export const MOVEMENT_REASON_LABEL: Record<MovementReason, string> = {
  initial: "Opening balance",
  purchase: "Purchased",
  consume: "Consumed",
  waste: "Wasted",
  adjust: "Adjusted",
};
