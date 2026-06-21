// Zod validation schemas — the single source of truth for input validation
// across the stack. Mobile form validation and backend request-body validation
// both import these from `@clay/shared`. Domain schemas expand as tables land
// in Phase 3+ (see docs/Phases.md).
import { z } from "zod";

import { PRODUCT_CATEGORIES } from "../constants/categories";

/** Units used across inventory and shopping items. */
export const UNITS = ["each", "kg", "lb", "oz", "g", "L", "mL"] as const;
export const unitSchema = z.enum(UNITS);
export type Unit = z.infer<typeof unitSchema>;

/** Create / edit a shopping list. */
export const shoppingListInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  isShared: z.boolean().default(false),
});
export type ShoppingListInput = z.infer<typeof shoppingListInputSchema>;

/** Add / edit an item on a shopping list. */
export const shoppingListItemInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  quantity: z.number().positive().default(1),
  unit: unitSchema.default("each"),
  isChecked: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});
export type ShoppingListItemInput = z.infer<typeof shoppingListItemInputSchema>;

/** Create / edit a product in the catalog. */
export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  brand: z.string().max(120).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  barcode: z.string().max(64).optional(),
  unit: unitSchema.optional(),
  notes: z.string().max(500).optional(),
});
export type ProductInput = z.infer<typeof productInputSchema>;
