// Inventory domain constants — shared by the mobile inventory module (Phase 4)
// and, later, the backend. Centralizing the literals keeps the Drizzle schema,
// Zod validation, and UI filters in agreement on a single source of truth.

/** Where an inventory item is physically stored. */
export const STORAGE_LOCATIONS = [
  'pantry',
  'fridge',
  'freezer',
  'other',
] as const;
export type StorageLocation = (typeof STORAGE_LOCATIONS)[number];

/**
 * Why an inventory quantity changed. Every adjustment writes a movement-log row
 * tagged with one of these so on-hand totals stay auditable.
 *
 * - `initial`  — opening balance when an item is first added
 * - `purchase` — stock added (groceries bought, restock)
 * - `consume`  — stock used up
 * - `waste`    — discarded (spoiled, expired)
 * - `adjust`   — manual correction to match reality
 */
export const MOVEMENT_REASONS = [
  'initial',
  'purchase',
  'consume',
  'waste',
  'adjust',
] as const;
export type MovementReason = (typeof MOVEMENT_REASONS)[number];

/** Days before an expiration date that an item is flagged "expiring soon". */
export const EXPIRING_SOON_DAYS = 7;
