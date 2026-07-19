import { ProductController } from "@/controller/ProductController";
import { syncStatusKeys } from "@/hooks/useSyncStatus";
import type { Product } from "@/models/products";
import type { ProductInput } from "@clay/shared";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

/** Query-key factory for product queries. */
export const productKeys = {
  all: ["products"] as const,
  list: () => [...productKeys.all, "list"] as const,
  detail: (id: number) => [...productKeys.all, "detail", id] as const,
};

/** Refresh catalog views and the sync badge after any local write. */
function invalidateProducts(client: QueryClient): Promise<void> {
  return Promise.all([
    client.invalidateQueries({ queryKey: productKeys.all }),
    client.invalidateQueries({ queryKey: syncStatusKeys.status }),
  ]).then(() => undefined);
}

/** All live catalog products, for the Groceries tab. */
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: productKeys.list(),
    queryFn: () => ProductController.getAll(),
  });
}

/** A single catalog product (for detail headers). */
export function useProduct(id: number) {
  return useQuery<Product | undefined>({
    queryKey: productKeys.detail(id),
    queryFn: () => ProductController.getById(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => ProductController.create(input),
    onSuccess: () => invalidateProducts(client),
  });
}

export function useUpdateProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProductInput }) =>
      ProductController.update(id, input),
    onSuccess: () => invalidateProducts(client),
  });
}

export function useDeleteProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ProductController.remove(id),
    onSuccess: () => invalidateProducts(client),
  });
}
