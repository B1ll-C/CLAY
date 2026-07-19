import { ProductController } from "@/controller/ProductController";
import { SyncController } from "@/controller/SyncController";
import {
  syncCreatePatch,
  syncDeletePatch,
  syncUpdatePatch,
} from "@/lib/sync/stamping";
import { effectivePrice, isPromoActive } from "@/lib/pricing/effectivePrice";
import { db } from "@/models/db";
import { products, type Product } from "@/models/products";
import {
  shoppingListItems,
  type ShoppingListItemRow,
} from "@/models/shoppingListItems";
import { storePrices, type StorePrice } from "@/models/storePrices";
import { stores, type Store } from "@/models/stores";
import type { BasketMode, StorePriceInput, Unit } from "@clay/shared";
import { and, asc, eq, isNull } from "drizzle-orm";

/** One store's price for a product, with the effective/cheapest status resolved. */
export interface PriceComparisonRow {
  price: StorePrice;
  store: Store;
  effectivePrice: number;
  isPromoActive: boolean;
  isCheapest: boolean;
}

/** A tracked product for the price hub — cheapest live price and how many stores carry it. */
export interface TrackedProductSummary {
  product: Product;
  storeCount: number;
  cheapestPrice: number;
  lastVerifiedAt: Date | null;
}

export interface BasketLineItem {
  itemId: number;
  productId: number;
  name: string;
  quantity: number;
  unit: Unit | null;
  unitPrice: number;
  lineTotal: number;
}

export interface StoreBasketOption {
  store: Store;
  items: BasketLineItem[];
  subtotal: number;
  coversAllPricedItems: boolean;
}

export interface UnpricedBasketItem {
  itemId: number;
  name: string;
  reason: "not_linked_to_product" | "no_tracked_price";
}

export interface CheapestBasketResult {
  mode: BasketMode;
  options: StoreBasketOption[];
  total: number;
  singleStoreBaseline: { store: Store; total: number } | null;
  estimatedSavings: number | null;
  unpricedItems: UnpricedBasketItem[];
  pricedItemCount: number;
  totalItemCount: number;
}

/**
 * Sync-aware DB operations for store prices and basket optimization (Phase 6).
 * Depends on `ProductController` + `StoreController` the way `InventoryController`
 * depends on `ProductController` — a price always names a product and a store.
 */
export const PriceController = {
  /** Live tracked products (≥1 live price), cheapest-first store summary. */
  listTrackedProducts: async (): Promise<TrackedProductSummary[]> => {
    const rows = await db
      .select({ price: storePrices, product: products })
      .from(storePrices)
      .innerJoin(products, eq(storePrices.productId, products.id))
      .where(and(isNull(storePrices.deletedAt), isNull(products.deletedAt)));

    const byProduct = new Map<
      number,
      { product: Product; prices: StorePrice[] }
    >();
    for (const { price, product } of rows) {
      const entry = byProduct.get(product.id);
      if (entry) entry.prices.push(price);
      else byProduct.set(product.id, { product, prices: [price] });
    }

    const now = new Date();
    const summaries: TrackedProductSummary[] = [];
    for (const { product, prices } of byProduct.values()) {
      const effectivePrices = prices.map((p) => effectivePrice(p, now));
      const lastVerifiedAt = prices.reduce<Date | null>((latest, p) => {
        if (!p.lastVerifiedAt) return latest;
        if (!latest || p.lastVerifiedAt > latest) return p.lastVerifiedAt;
        return latest;
      }, null);
      summaries.push({
        product,
        storeCount: prices.length,
        cheapestPrice: Math.min(...effectivePrices),
        lastVerifiedAt,
      });
    }
    summaries.sort((a, b) => a.product.name.localeCompare(b.product.name));
    return summaries;
  },

  /** Every live price for a product, cheapest first, with `isCheapest` resolved. */
  comparisonForProduct: async (
    productId: number,
  ): Promise<PriceComparisonRow[]> => {
    const rows = await db
      .select({ price: storePrices, store: stores })
      .from(storePrices)
      .innerJoin(stores, eq(storePrices.storeId, stores.id))
      .where(
        and(
          eq(storePrices.productId, productId),
          isNull(storePrices.deletedAt),
          isNull(stores.deletedAt),
        ),
      );

    const now = new Date();
    const withEffective = rows.map(({ price, store }) => ({
      price,
      store,
      effectivePrice: effectivePrice(price, now),
      isPromoActive: isPromoActive(price, now),
    }));
    const cheapest = withEffective.length
      ? Math.min(...withEffective.map((r) => r.effectivePrice))
      : null;

    return withEffective
      .map((r) => ({ ...r, isCheapest: r.effectivePrice === cheapest }))
      .sort((a, b) => a.effectivePrice - b.effectivePrice);
  },

  /** Upsert a price for a (productId, storeId) pair against the unique index. */
  recordPrice: async (input: StorePriceInput): Promise<number> => {
    const now = new Date();
    const [existing] = await db
      .select()
      .from(storePrices)
      .where(
        and(
          eq(storePrices.productId, input.productId),
          eq(storePrices.storeId, input.storeId),
          isNull(storePrices.deletedAt),
        ),
      )
      .limit(1);

    const fields = {
      price: input.price,
      unit: input.unit ?? null,
      promotionPrice: input.promotionPrice ?? null,
      promotionExpiresAt: input.promotionExpiresAt ?? null,
      lastVerifiedAt: now,
    };

    if (existing) {
      await db
        .update(storePrices)
        .set({ ...fields, ...syncUpdatePatch(existing, now) })
        .where(eq(storePrices.id, existing.id));
      await SyncController.enqueue({
        table: "store_prices",
        recordId: existing.id,
        operation: "UPDATE",
        payload: {
          productId: input.productId,
          storeId: input.storeId,
          ...fields,
        },
      });
      return existing.id;
    }

    const [created] = await db
      .insert(storePrices)
      .values({
        productId: input.productId,
        storeId: input.storeId,
        ...fields,
        ...syncCreatePatch(now),
      })
      .returning();
    await SyncController.enqueue({
      table: "store_prices",
      recordId: created.id,
      operation: "CREATE",
      payload: {
        productId: input.productId,
        storeId: input.storeId,
        ...fields,
      },
    });
    return created.id;
  },

  /**
   * Resolve a typed product name before recording a price — the hub FAB path,
   * where no product is already selected. Returns the resolved `productId`
   * alongside the price id so the caller can navigate to that product's
   * comparison view.
   */
  recordPriceForProductName: async (
    name: string,
    rest: Omit<StorePriceInput, "productId">,
    extra?: { brand?: string | null },
  ): Promise<{ id: number; productId: number }> => {
    const product = await ProductController.findOrCreateByName(name, extra);
    const id = await PriceController.recordPrice({ ...rest, productId: product.id });
    return { id, productId: product.id };
  },

  removePrice: async (id: number): Promise<void> => {
    const [current] = await db
      .select()
      .from(storePrices)
      .where(eq(storePrices.id, id))
      .limit(1);
    if (!current) throw new Error(`Store price ${id} not found`);
    const now = new Date();
    await db
      .update(storePrices)
      .set(syncDeletePatch(current, now))
      .where(eq(storePrices.id, id));
    await SyncController.enqueue({
      table: "store_prices",
      recordId: id,
      operation: "DELETE",
      payload: null,
    });
  },

  /**
   * Group a list's items into per-store baskets and total them.
   *
   * - `minimize_cost`  — each priced item goes to its own cheapest store.
   * - `minimize_trips` — for every store carrying ≥1 priced item, build the
   *   option covering only what it stocks; pick the option with the most
   *   coverage, breaking ties by lowest subtotal.
   */
  getCheapestBasket: async (
    listId: number,
    mode: BasketMode,
  ): Promise<CheapestBasketResult> => {
    const items: ShoppingListItemRow[] = await db
      .select()
      .from(shoppingListItems)
      .where(
        and(
          eq(shoppingListItems.listId, listId),
          isNull(shoppingListItems.deletedAt),
        ),
      )
      .orderBy(asc(shoppingListItems.sortOrder));

    const unpricedItems: UnpricedBasketItem[] = [];
    const priced: {
      item: ShoppingListItemRow;
      rows: PriceComparisonRow[];
    }[] = [];

    for (const item of items) {
      if (item.productId == null) {
        unpricedItems.push({
          itemId: item.id,
          name: item.name,
          reason: "not_linked_to_product",
        });
        continue;
      }
      const rows = await PriceController.comparisonForProduct(item.productId);
      if (rows.length === 0) {
        unpricedItems.push({
          itemId: item.id,
          name: item.name,
          reason: "no_tracked_price",
        });
        continue;
      }
      priced.push({ item, rows });
    }

    const pricedItemCount = priced.length;
    const totalItemCount = items.length;

    if (pricedItemCount === 0) {
      return {
        mode,
        options: [],
        total: 0,
        singleStoreBaseline: null,
        estimatedSavings: null,
        unpricedItems,
        pricedItemCount,
        totalItemCount,
      };
    }

    const lineFor = (
      item: ShoppingListItemRow,
      row: PriceComparisonRow,
    ): BasketLineItem => ({
      itemId: item.id,
      productId: item.productId!,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: row.effectivePrice,
      lineTotal: row.effectivePrice * item.quantity,
    });

    // Every store carrying ≥1 priced item, with the subset of items it stocks —
    // the candidate set both modes and the single-store baseline draw from.
    const perStoreOptions = allStoreOptions(priced, lineFor, pricedItemCount);

    let options: StoreBasketOption[];
    if (mode === "minimize_cost") {
      const byStore = new Map<number, { store: Store; items: BasketLineItem[] }>();
      for (const { item, rows } of priced) {
        const cheapest = rows[0]!;
        const entry = byStore.get(cheapest.store.id);
        const line = lineFor(item, cheapest);
        if (entry) entry.items.push(line);
        else byStore.set(cheapest.store.id, { store: cheapest.store, items: [line] });
      }
      options = [...byStore.values()].map((o) => buildOption(o.store, o.items, pricedItemCount));
    } else {
      options = [...perStoreOptions].sort((a, b) => {
        if (a.items.length !== b.items.length) return b.items.length - a.items.length;
        return a.subtotal - b.subtotal;
      });
    }

    const total =
      mode === "minimize_cost"
        ? options.reduce((sum, o) => sum + o.subtotal, 0)
        : (options[0]?.subtotal ?? 0);

    const fullCoverageOptions = perStoreOptions.filter((o) => o.coversAllPricedItems);
    const singleStoreBaseline = fullCoverageOptions.length
      ? fullCoverageOptions.reduce((best, o) =>
          o.subtotal < best.subtotal ? o : best,
        )
      : null;

    return {
      mode,
      options,
      total,
      singleStoreBaseline: singleStoreBaseline
        ? { store: singleStoreBaseline.store, total: singleStoreBaseline.subtotal }
        : null,
      estimatedSavings: singleStoreBaseline
        ? singleStoreBaseline.subtotal - total
        : null,
      unpricedItems,
      pricedItemCount,
      totalItemCount,
    };
  },
};

function buildOption(
  store: Store,
  items: BasketLineItem[],
  pricedItemCount: number,
): StoreBasketOption {
  return {
    store,
    items,
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    coversAllPricedItems: items.length === pricedItemCount,
  };
}

/**
 * One option per store that carries at least one priced item, holding only
 * the subset of items that store actually stocks. Feeds `minimize_trips`
 * directly and the single-store baseline (via `coversAllPricedItems`) for
 * both modes.
 */
function allStoreOptions(
  priced: { item: ShoppingListItemRow; rows: PriceComparisonRow[] }[],
  lineFor: (item: ShoppingListItemRow, row: PriceComparisonRow) => BasketLineItem,
  pricedItemCount: number,
): StoreBasketOption[] {
  const storeIds = new Set<number>();
  for (const { rows } of priced) {
    for (const row of rows) storeIds.add(row.store.id);
  }
  const options: StoreBasketOption[] = [];
  for (const storeId of storeIds) {
    let storeRef: Store | null = null;
    const lines: BasketLineItem[] = [];
    for (const { item, rows } of priced) {
      const match = rows.find((r) => r.store.id === storeId);
      if (!match) continue;
      storeRef = match.store;
      lines.push(lineFor(item, match));
    }
    if (storeRef) options.push(buildOption(storeRef, lines, pricedItemCount));
  }
  return options;
}
