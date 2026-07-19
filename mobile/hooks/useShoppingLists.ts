import {
  ShoppingListController,
  type ShoppingListSummary,
} from "@/controller/ShoppingListController";
import { syncStatusKeys } from "@/hooks/useSyncStatus";
import type { ShoppingListItemRow } from "@/models/shoppingListItems";
import type { ShoppingListRow } from "@/models/shoppingLists";
import type {
  ShoppingListInput,
  ShoppingListItemInput,
} from "@clay/shared";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

/** Query-key factory for shopping-list queries. */
export const shoppingListKeys = {
  all: ["shopping-lists"] as const,
  summaries: () => [...shoppingListKeys.all, "summaries"] as const,
  detail: (id: number) => [...shoppingListKeys.all, "detail", id] as const,
  items: (listId: number) => [...shoppingListKeys.all, "items", listId] as const,
};

/** Refresh shopping-list views and the sync badge after any local write. */
function invalidateLists(client: QueryClient): Promise<void> {
  return Promise.all([
    client.invalidateQueries({ queryKey: shoppingListKeys.all }),
    client.invalidateQueries({ queryKey: syncStatusKeys.status }),
  ]).then(() => undefined);
}

/** All lists with item/checked counts, newest first. */
export function useShoppingLists() {
  return useQuery<ShoppingListSummary[]>({
    queryKey: shoppingListKeys.summaries(),
    queryFn: () => ShoppingListController.listSummaries(),
  });
}

/** A single list (for the detail header). */
export function useShoppingList(id: number) {
  return useQuery<ShoppingListRow | undefined>({
    queryKey: shoppingListKeys.detail(id),
    queryFn: () => ShoppingListController.getList(id),
    enabled: Number.isFinite(id),
  });
}

/** Live items on a list, in display order. */
export function useShoppingListItems(listId: number) {
  return useQuery<ShoppingListItemRow[]>({
    queryKey: shoppingListKeys.items(listId),
    queryFn: () => ShoppingListController.getItems(listId),
    enabled: Number.isFinite(listId),
  });
}

export function useCreateList() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ShoppingListInput) =>
      ShoppingListController.createList(input),
    onSuccess: () => invalidateLists(client),
  });
}

export function useUpdateList() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ShoppingListInput }) =>
      ShoppingListController.updateList(id, input),
    onSuccess: () => invalidateLists(client),
  });
}

export function useDeleteList() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ShoppingListController.removeList(id),
    onSuccess: () => invalidateLists(client),
  });
}

export function useAddListItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      input,
    }: {
      listId: number;
      input: ShoppingListItemInput;
    }) => ShoppingListController.addItem(listId, input),
    onSuccess: () => invalidateLists(client),
  });
}

export function useUpdateListItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ShoppingListItemInput }) =>
      ShoppingListController.updateItem(id, input),
    onSuccess: () => invalidateLists(client),
  });
}

export function useToggleListItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isChecked }: { id: number; isChecked: boolean }) =>
      ShoppingListController.setItemChecked(id, isChecked),
    onSuccess: () => invalidateLists(client),
  });
}

export function useDeleteListItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ShoppingListController.removeItem(id),
    onSuccess: () => invalidateLists(client),
  });
}

export function useSetAllChecked() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, isChecked }: { listId: number; isChecked: boolean }) =>
      ShoppingListController.setAllChecked(listId, isChecked),
    onSuccess: () => invalidateLists(client),
  });
}

export function useClearChecked() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (listId: number) => ShoppingListController.clearChecked(listId),
    onSuccess: () => invalidateLists(client),
  });
}

/** "Add low-stock items" — populate a list from inventory alerts. */
export function useGenerateFromAlerts() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (listId: number) =>
      ShoppingListController.generateFromAlerts(listId),
    onSuccess: () => invalidateLists(client),
  });
}
