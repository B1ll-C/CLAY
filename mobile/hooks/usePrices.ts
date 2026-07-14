import {
  PriceController,
  type CheapestBasketResult,
  type PriceComparisonRow,
  type TrackedProductSummary,
} from "@/controller/PriceController";
import { syncStatusKeys } from "@/hooks/useSyncStatus";
import type { BasketMode, StorePriceInput } from "@clay/shared";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

/** Query-key factory for price queries. */
export const priceKeys = {
  all: ["prices"] as const,
  trackedProducts: () => [...priceKeys.all, "tracked-products"] as const,
  comparison: (productId: number) =>
    [...priceKeys.all, "comparison", productId] as const,
  basket: (listId: number, mode: BasketMode) =>
    [...priceKeys.all, "basket", listId, mode] as const,
};

/** Refresh price views and the sync badge after any local write. */
export function invalidatePrices(client: QueryClient): Promise<void> {
  return Promise.all([
    client.invalidateQueries({ queryKey: priceKeys.all }),
    client.invalidateQueries({ queryKey: syncStatusKeys.status }),
  ]).then(() => undefined);
}

/** Tracked products for the price hub. */
export function useTrackedProducts() {
  return useQuery<TrackedProductSummary[]>({
    queryKey: priceKeys.trackedProducts(),
    queryFn: () => PriceController.listTrackedProducts(),
  });
}

/** Per-store price comparison for one product, cheapest first. */
export function usePriceComparison(productId: number) {
  return useQuery<PriceComparisonRow[]>({
    queryKey: priceKeys.comparison(productId),
    queryFn: () => PriceController.comparisonForProduct(productId),
    enabled: Number.isFinite(productId),
  });
}

/**
 * Cheapest-basket grouping for a shopping list. Gated on `enabled` (the
 * basket modal's visibility) rather than wired to shopping-list invalidation —
 * keeps the pricing and shopping-list modules decoupled.
 */
export function useCheapestBasket(
  listId: number,
  mode: BasketMode,
  options: { enabled: boolean },
) {
  return useQuery<CheapestBasketResult>({
    queryKey: priceKeys.basket(listId, mode),
    queryFn: () => PriceController.getCheapestBasket(listId, mode),
    enabled: options.enabled && Number.isFinite(listId),
  });
}

export function useRecordPrice() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: StorePriceInput) => PriceController.recordPrice(input),
    onSuccess: () => invalidatePrices(client),
  });
}

export function useRecordPriceForProductName() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      rest,
      extra,
    }: {
      name: string;
      rest: Omit<StorePriceInput, "productId">;
      extra?: { brand?: string | null };
    }) => PriceController.recordPriceForProductName(name, rest, extra),
    onSuccess: () => invalidatePrices(client),
  });
}

export function useDeletePrice() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => PriceController.removePrice(id),
    onSuccess: () => invalidatePrices(client),
  });
}
