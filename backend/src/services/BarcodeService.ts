import { and, eq, isNull } from 'drizzle-orm';

import { db } from '../db/index.js';
import { products, type Product } from '../db/schema/index.js';
import { lookupOpenFoodFacts } from '../lib/openFoodFacts.js';
import { redis } from '../lib/redis.js';

const CACHE_TTL_SECONDS = 24 * 60 * 60;
const cacheKey = (barcode: string) => `barcode:${barcode}`;

async function findLocal(barcode: string): Promise<Product | undefined> {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.barcode, barcode), isNull(products.deletedAt)));
  return row;
}

/**
 * Resolves a barcode to a shared catalog product: Postgres (and a Redis
 * cache in front of it) first, Open Food Facts as the fallback for codes
 * nobody has scanned yet. Mirrors `docs/Phases.md` Phase 7's deferred spec.
 */
export const BarcodeService = {
  async lookup(barcode: string): Promise<Product | null> {
    const code = barcode.trim();
    if (!code) return null;

    const cached = await redis.get(cacheKey(code));
    if (cached) return JSON.parse(cached) as Product;

    const local = await findLocal(code);
    if (local) return local;

    const external = await lookupOpenFoodFacts(code);
    if (!external) return null;

    const [created] = await db
      .insert(products)
      .values({
        name: external.name,
        brand: external.brand,
        barcode: code,
        imageUrl: external.imageUrl,
      })
      .returning();

    await redis.set(cacheKey(code), JSON.stringify(created), 'EX', CACHE_TTL_SECONDS);
    return created;
  },
};
