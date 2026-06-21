// Zod validation schemas — the single source of truth for input validation
// across the stack. Mobile form validation and backend request-body validation
// both import these from `@clay/shared`. Domain schemas expand as tables land
// in Phase 3+ (see docs/Phases.md).
import { z } from "zod";

import { PRODUCT_CATEGORIES } from "../constants/categories";
import { MOVEMENT_REASONS, STORAGE_LOCATIONS } from "../constants/inventory";

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

/** Storage location of an inventory item. */
export const storageLocationSchema = z.enum(STORAGE_LOCATIONS);
/** Reason an inventory quantity changed (drives the movement log). */
export const movementReasonSchema = z.enum(MOVEMENT_REASONS);

/**
 * Create / edit an inventory item. The item names a catalog product (the mobile
 * form resolves `productName` to a `productId` via find-or-create); the rest are
 * stock attributes. `expirationDate` is a JS `Date` so forms can bind a picker
 * directly — the sync wire format serializes it to unix seconds separately.
 */
export const inventoryItemInputSchema = z.object({
  productName: z.string().trim().min(1, "Name is required").max(120),
  brand: z.string().trim().max(120).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  quantity: z.number().nonnegative("Quantity can't be negative").default(0),
  unit: unitSchema.optional(),
  location: storageLocationSchema.default("pantry"),
  minQuantity: z
    .number()
    .nonnegative("Threshold can't be negative")
    .nullable()
    .optional(),
  costPerUnit: z.number().nonnegative().nullable().optional(),
  expirationDate: z.date().nullable().optional(),
  notes: z.string().max(500).optional(),
});
export type InventoryItemInput = z.infer<typeof inventoryItemInputSchema>;

/**
 * Adjust an item's on-hand quantity. `delta` is signed (negative consumes); the
 * controller clamps the resulting quantity at zero and records a movement row.
 */
export const inventoryAdjustmentInputSchema = z.object({
  delta: z.number().refine((n) => n !== 0, "Enter a non-zero amount"),
  reason: movementReasonSchema.default("adjust"),
  notes: z.string().max(500).optional(),
});
export type InventoryAdjustmentInput = z.infer<
  typeof inventoryAdjustmentInputSchema
>;
