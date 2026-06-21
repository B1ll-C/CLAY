import { ProductController } from "@/controller/ProductController";
import { syncStatusKeys } from "@/hooks/useSyncStatus";
import type { Product } from "@/models/products";
import type { ProductCategory } from "@clay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Local-first barcode lookup for the scanner (Phase 7).
 *
 * Resolves a scanned code against the local `products` table first — this works
 * fully offline. When nothing matches and the device is online, the remote
 * Open Food Facts lookup (backend → `GET /api/v1/products/barcode/:code`) fills
 * the gap; that transport ships with the Phase 8 backend, so today an unknown
 * code falls through to manual entry via `useSaveScannedProduct`.
 */
export function useBarcodeLookup() {
  return useMutation<Product | undefined, Error, string>({
    mutationFn: (barcode: string) => ProductController.findByBarcode(barcode),
  });
}

/**
 * Persist a scanned-but-unknown product as a skeleton catalog row
 * (`sync_status = 'pending_create'`) so it can be added to inventory or a list
 * immediately and synced once a backend exists.
 */
export function useSaveScannedProduct() {
  const client = useQueryClient();
  return useMutation<
    Product,
    Error,
    { barcode: string; name: string; category?: ProductCategory | null }
  >({
    mutationFn: ({ barcode, name, category }) =>
      ProductController.findOrCreateByBarcode(barcode, { name, category }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: syncStatusKeys.status }),
  });
}
