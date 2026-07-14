import { SyncController } from "@/controller/SyncController";
import { syncCreatePatch } from "@/lib/sync/stamping";
import { db } from "@/models/db";
import { products, type Product } from "@/models/products";
import type { ProductCategory } from "@clay/shared";
import { and, eq, isNull, sql } from "drizzle-orm";

/**
 * Sync-aware DB operations for the product catalog. Inventory and (later)
 * shopping/price modules resolve free-text names to catalog rows through
 * `findOrCreateByName`, so a product record exists before anything references it.
 *
 * Every write stamps the row for sync (see lib/sync/stamping) and records an
 * outbox entry (see controller/SyncController) so it pushes once Phase 8 lands.
 */
export const ProductController = {
  /** All live (non-tombstoned) products. */
  getAll: async (): Promise<Product[]> =>
    db.select().from(products).where(isNull(products.deletedAt)),

  getById: async (id: number): Promise<Product | undefined> => {
    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return row;
  },

  /** The live product carrying `barcode`, if one is on file. */
  findByBarcode: async (barcode: string): Promise<Product | undefined> => {
    const code = barcode.trim();
    if (!code) return undefined;
    const [row] = await db
      .select()
      .from(products)
      .where(and(isNull(products.deletedAt), eq(products.barcode, code)))
      .limit(1);
    return row;
  },

  /**
   * Resolve a scanned `barcode` to a catalog product, creating a skeleton record
   * (name + barcode) when the code is unknown. Check-then-insert keeps a barcode
   * from being duplicated if the same code is scanned twice offline; the remote
   * Open Food Facts lookup that enriches unknown codes lands with the Phase 8
   * backend transport.
   */
  findOrCreateByBarcode: async (
    barcode: string,
    extra: {
      name: string;
      brand?: string | null;
      category?: ProductCategory | null;
    },
  ): Promise<Product> => {
    const code = barcode.trim();
    const existing = await ProductController.findByBarcode(code);
    if (existing) return existing;

    const [created] = await db
      .insert(products)
      .values({
        name: extra.name.trim(),
        barcode: code || null,
        brand: extra.brand ?? null,
        category: extra.category ?? null,
        ...syncCreatePatch(),
      })
      .returning();
    await SyncController.enqueue({
      table: "products",
      recordId: created.id,
      operation: "CREATE",
      payload: {
        name: created.name,
        barcode: created.barcode,
        brand: created.brand,
        category: created.category,
      },
    });
    return created;
  },

  /**
   * Return the live product matching `name` (case-insensitive), creating one if
   * none exists. Used by the inventory form so users can add stock by typing a
   * name without first curating a catalog.
   */
  findOrCreateByName: async (
    name: string,
    extra?: { brand?: string | null; category?: ProductCategory | null },
  ): Promise<Product> => {
    const trimmed = name.trim();
    const [existing] = await db
      .select()
      .from(products)
      .where(
        and(
          isNull(products.deletedAt),
          eq(sql`lower(${products.name})`, trimmed.toLowerCase()),
        ),
      )
      .limit(1);
    if (existing) return existing;

    const [created] = await db
      .insert(products)
      .values({
        name: trimmed,
        brand: extra?.brand ?? null,
        category: extra?.category ?? null,
        ...syncCreatePatch(),
      })
      .returning();
    await SyncController.enqueue({
      table: "products",
      recordId: created.id,
      operation: "CREATE",
      payload: {
        name: created.name,
        brand: created.brand,
        category: created.category,
      },
    });
    return created;
  },
};
