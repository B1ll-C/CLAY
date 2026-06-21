import type { InventoryItem } from "@/models/inventoryItems";
import type { InventoryFilter } from "@/store/uiStore";
import { EXPIRING_SOON_DAYS } from "@clay/shared";

/**
 * Smart-alert states an inventory item can be in. An item may carry several at
 * once (e.g. low stock *and* expiring soon); `ok` means none apply. These mirror
 * the `InventoryFilter` categories so the filter bar and badges stay in lockstep.
 */
export type AlertStatus =
  | "out_of_stock"
  | "low_stock"
  | "expired"
  | "expiring_soon";

/** Minimal shape the alert rules need — satisfied by every inventory row. */
type AlertInput = Pick<
  InventoryItem,
  "quantity" | "minQuantity" | "expirationDate"
>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** All alerts that currently apply to an item, most-severe first. */
export function alertStatuses(
  item: AlertInput,
  now: Date = new Date(),
): AlertStatus[] {
  const statuses: AlertStatus[] = [];

  if (item.quantity <= 0) {
    statuses.push("out_of_stock");
  } else if (item.minQuantity != null && item.quantity <= item.minQuantity) {
    statuses.push("low_stock");
  }

  if (item.expirationDate != null) {
    const expiry = item.expirationDate.getTime();
    const nowMs = now.getTime();
    if (expiry < nowMs) {
      statuses.push("expired");
    } else if (expiry <= nowMs + EXPIRING_SOON_DAYS * DAY_MS) {
      statuses.push("expiring_soon");
    }
  }

  return statuses;
}

/** Whether an item should appear under the given Inventory-tab filter. */
export function matchesFilter(
  item: AlertInput,
  filter: InventoryFilter,
  now: Date = new Date(),
): boolean {
  if (filter === "all") return true;
  return alertStatuses(item, now).includes(filter);
}

/** Count of items in each alert category — drives the filter-bar badges. */
export function alertCounts(
  items: AlertInput[],
  now: Date = new Date(),
): Record<AlertStatus, number> {
  const counts: Record<AlertStatus, number> = {
    out_of_stock: 0,
    low_stock: 0,
    expired: 0,
    expiring_soon: 0,
  };
  for (const item of items) {
    for (const status of alertStatuses(item, now)) counts[status] += 1;
  }
  return counts;
}
