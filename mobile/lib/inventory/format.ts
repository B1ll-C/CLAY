// Small display helpers for the inventory UI. Kept dependency-free (no date
// library) so they're cheap to use in list rows.

/** "2 kg", "1.5 L", or "3" when no unit is set. Trims trailing decimal zeros. */
export function formatQuantity(qty: number, unit?: string | null): string {
  const n = Number.isInteger(qty)
    ? String(qty)
    : qty.toFixed(2).replace(/\.?0+$/, "");
  return unit ? `${n} ${unit}` : n;
}

/** Localized short date, or an em dash when unset. */
export function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Human relative expiry, e.g. "Expires in 3d" / "Expired 2d ago". */
export function expiryLabel(
  d: Date | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!d) return null;
  const days = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days}d`;
}

/** Date → "YYYY-MM-DD" (local) for the text date field. */
export function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "YYYY-MM-DD" → Date (local midnight), or null if blank/invalid. */
export function parseDateInput(value: string): Date | null {
  const text = value.trim();
  if (!text) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Parse a numeric text field, returning null for blank/invalid input. */
export function parseNumber(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}
