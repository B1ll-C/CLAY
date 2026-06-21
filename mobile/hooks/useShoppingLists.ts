import { db } from "@/models/db";
import { shoppingLists } from "@/models/index";
import { useQuery } from "@tanstack/react-query";

/** Query-key factory for shopping-list queries. */
export const shoppingListKeys = {
  all: ["shopping-lists"] as const,
};

/**
 * Loads all shopping lists from the local SQLite database via React Query.
 *
 * This is the foundational read hook wired in Phase 2. The full DB-backed
 * shopping-list module (multi-list CRUD, inventory integration, mutations,
 * and the schema rewrite) lands in Phase 5 — see docs/Phases.md.
 */
export function useShoppingLists() {
  return useQuery({
    queryKey: shoppingListKeys.all,
    queryFn: async () => await db.select().from(shoppingLists),
  });
}
