import { db } from "@/models/db"; // import the shared Drizzle instance
import { shoppingLists } from "@/models/index";

/**
 * Thin bridge kept compiling against the Phase 3 `shopping_lists` table. The
 * full DB-backed shopping-list module (multi-list CRUD, sync-aware writes) is
 * rewritten in Phase 5 — see docs/Phases.md.
 */
export const TaskController = {
  getAll: async () => {
    return await db.select().from(shoppingLists);
  },

  add: async (title: string) => {
    await db.insert(shoppingLists).values({ title });
  },
};
