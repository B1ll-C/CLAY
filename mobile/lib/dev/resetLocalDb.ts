import { db } from "@/models/db";
import {
  inventoryItems,
  inventoryMovements,
  products,
  shoppingListItems,
  shoppingLists,
  storePrices,
  stores,
  syncQueue,
} from "@/models";

/**
 * Dev-only: wipes every row from the local SQLite database, children before
 * parents. There is no local `users` table — auth lives in SecureStore
 * (`mobile/lib/auth/SecureTokenStore.ts`) and is untouched by this.
 *
 * Not reachable from a terminal script: the DB only exists inside the running
 * app. Registered on `global.resetLocalDb` in dev builds so it can be called
 * from the in-app JS debugger console (Metro/Chrome/Flipper) — pair with
 * `npm run reset` on the backend to wipe both sides during testing.
 */
export async function resetLocalDb() {
  await db.delete(syncQueue);
  await db.delete(inventoryMovements);
  await db.delete(storePrices);
  await db.delete(shoppingListItems);
  await db.delete(inventoryItems);
  await db.delete(shoppingLists);
  await db.delete(stores);
  await db.delete(products);
  console.log("[resetLocalDb] Local SQLite wiped.");
}

if (__DEV__) {
  // @ts-expect-error dev-only debugger console hook, not a typed global
  global.resetLocalDb = resetLocalDb;
}
