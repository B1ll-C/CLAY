import { StoreController } from "@/controller/StoreController";
import { priceKeys } from "@/hooks/usePrices";
import { syncStatusKeys } from "@/hooks/useSyncStatus";
import type { Store } from "@/models/stores";
import type { StoreInput } from "@clay/shared";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

/** Query-key factory for store queries. */
export const storeKeys = {
  all: ["stores"] as const,
  list: () => [...storeKeys.all, "list"] as const,
  detail: (id: number) => [...storeKeys.all, "detail", id] as const,
};

/** Refresh store views, dependent price views, and the sync badge after any local write. */
export function invalidateStores(client: QueryClient): Promise<void> {
  return Promise.all([
    client.invalidateQueries({ queryKey: storeKeys.all }),
    client.invalidateQueries({ queryKey: priceKeys.all }),
    client.invalidateQueries({ queryKey: syncStatusKeys.status }),
  ]).then(() => undefined);
}

/** All live stores, alphabetical. */
export function useStores() {
  return useQuery<Store[]>({
    queryKey: storeKeys.list(),
    queryFn: () => StoreController.getAll(),
  });
}

export function useStore(id: number) {
  return useQuery<Store | undefined>({
    queryKey: storeKeys.detail(id),
    queryFn: () => StoreController.getById(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateStore() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: StoreInput) => StoreController.create(input),
    onSuccess: () => invalidateStores(client),
  });
}

export function useUpdateStore() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: StoreInput }) =>
      StoreController.update(id, input),
    onSuccess: () => invalidateStores(client),
  });
}

export function useDeleteStore() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => StoreController.remove(id),
    onSuccess: () => invalidateStores(client),
  });
}
