// Small display helpers for the price-comparison UI. Reuses the number/date
// parsing already proven out in the inventory module rather than duplicating it.
export { parseNumber, parseDateInput, toDateInput } from "@/lib/inventory/format";

/** "$3.48" — always two decimal places. */
export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Human relative "last verified" label, e.g. "Today" / "2 days ago". */
export function relativeVerified(
  d: Date | null | undefined,
  now: Date = new Date(),
): string {
  if (!d) return "Never verified";
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
