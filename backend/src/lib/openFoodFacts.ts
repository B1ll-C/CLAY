/**
 * Thin client for the free, keyless Open Food Facts product API. Uses Node's
 * built-in `fetch` (Node 22) instead of adding an HTTP-client dependency, per
 * the Phase 8 plan.
 */
const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v2/product';

export interface OpenFoodFactsProduct {
  name: string;
  brand: string | null;
  imageUrl: string | null;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    image_url?: string;
  };
}

/**
 * Looks up `barcode` against Open Food Facts. Returns `null` both when the
 * barcode is unknown to OFF and when OFF has a record but no usable product
 * name — either way there's nothing worth persisting to our catalog.
 *
 * OFF's `categories` field is free-text and doesn't map onto our fixed
 * `PRODUCT_CATEGORIES` enum, so category is intentionally left for the user
 * to set rather than guessed from OFF data.
 */
export async function lookupOpenFoodFacts(barcode: string): Promise<OpenFoodFactsProduct | null> {
  const response = await fetch(`${OFF_BASE_URL}/${encodeURIComponent(barcode)}.json`, {
    headers: { 'User-Agent': 'CLAY-App - backend barcode lookup' },
  });
  if (!response.ok) return null;

  const body = (await response.json()) as OpenFoodFactsResponse;
  const name = body.product?.product_name?.trim();
  if (body.status !== 1 || !name) return null;

  return {
    name,
    brand: body.product?.brands?.split(',')[0]?.trim() || null,
    imageUrl: body.product?.image_url ?? null,
  };
}
