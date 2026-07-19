import {
  InventoryController,
  type InventoryItemView,
} from "@/controller/InventoryController";
import type { InventoryMovement } from "@/models/inventoryMovements";
import { syncStatusKeys } from "@/hooks/useSyncStatus";
import type {
  InventoryAdjustmentInput,
  InventoryItemInput,
} from "@clay/shared";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

/** Query-key factory for inventory queries. */
export const inventoryKeys = {
  all: ["inventory"] as const,
  list: () => [...inventoryKeys.all, "list"] as const,
  detail: (id: number) => [...inventoryKeys.all, "detail", id] as const,
  movements: (id: number) => [...inventoryKeys.all, "movements", id] as const,
};

/** Refresh inventory views and the sync badge after any local write. */
function invalidateInventory(client: QueryClient): Promise<void> {
  return Promise.all([
    client.invalidateQueries({ queryKey: inventoryKeys.all }),
    client.invalidateQueries({ queryKey: syncStatusKeys.status }),
  ]).then(() => undefined);
}

/** All live inventory items with their product, newest first. */
export function useInventory() {
  return useQuery<InventoryItemView[]>({
    queryKey: inventoryKeys.list(),
    queryFn: () => InventoryController.list(),
  });
}

/** A single inventory item (with product) for the detail screen. */
export function useInventoryItem(id: number) {
  return useQuery<InventoryItemView | undefined>({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => InventoryController.getById(id),
    enabled: Number.isFinite(id),
  });
}

/** The movement log for an item, newest first. */
export function useInventoryMovements(id: number) {
  return useQuery<InventoryMovement[]>({
    queryKey: inventoryKeys.movements(id),
    queryFn: () => InventoryController.getMovements(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateInventoryItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: InventoryItemInput) => InventoryController.create(input),
    onSuccess: () => invalidateInventory(client),
  });
}

export function useUpdateInventoryItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: InventoryItemInput }) =>
      InventoryController.update(id, input),
    onSuccess: () => invalidateInventory(client),
  });
}

export function useAdjustInventoryQuantity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: InventoryAdjustmentInput;
    }) => InventoryController.adjustQuantity(id, input),
    onSuccess: () => invalidateInventory(client),
  });
}

export function useDeleteInventoryItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => InventoryController.remove(id),
    onSuccess: () => invalidateInventory(client),
  });
}
