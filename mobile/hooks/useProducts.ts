import { ProductController } from "@/controller/ProductController";
import type { Product } from "@/models/products";
import { useQuery } from "@tanstack/react-query";

/** Query-key factory for product queries. */
export const productKeys = {
  all: ["products"] as const,
  detail: (id: number) => [...productKeys.all, "detail", id] as const,
};

/** A single catalog product (for detail headers). */
export function useProduct(id: number) {
  return useQuery<Product | undefined>({
    queryKey: productKeys.detail(id),
    queryFn: () => ProductController.getById(id),
    enabled: Number.isFinite(id),
  });
}
