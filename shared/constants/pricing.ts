// Price-comparison domain constants (Phase 6) — how "cheapest basket" groups
// a shopping list's items across stores.
//
// - `minimize_cost`  — assign every item to its own cheapest store, ignoring trip count
// - `minimize_trips` — prefer fewer stores, picking the store covering the most items
export const BASKET_MODES = ['minimize_cost', 'minimize_trips'] as const;
export type BasketMode = (typeof BASKET_MODES)[number];
