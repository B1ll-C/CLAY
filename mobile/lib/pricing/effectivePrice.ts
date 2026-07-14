import type { StorePrice } from "@/models/storePrices";

/** Minimal shape the promo rules need — satisfied by every store-price row. */
type PromoInput = Pick<StorePrice, "promotionPrice" | "promotionExpiresAt">;

/** Whether a row's promotion is currently in effect. */
export function isPromoActive(
  row: PromoInput,
  now: Date = new Date(),
): boolean {
  if (row.promotionPrice == null) return false;
  if (row.promotionExpiresAt == null) return true;
  return row.promotionExpiresAt.getTime() > now.getTime();
}

/** The price that actually applies right now — promo price when active, else regular. */
export function effectivePrice(
  row: Pick<StorePrice, "price" | "promotionPrice" | "promotionExpiresAt">,
  now: Date = new Date(),
): number {
  return isPromoActive(row, now) ? row.promotionPrice! : row.price;
}
