import { create } from "zustand";

/** Inventory list filter — mirrors the smart-alert categories from Phase 4. */
export type InventoryFilter =
  | "all"
  | "low_stock"
  | "expiring_soon"
  | "expired"
  | "out_of_stock";

type UiState = {
  /** Currently focused shopping list, e.g. for the list-detail modal. */
  activeListId: number | null;
  setActiveListId: (id: number | null) => void;

  /** Visibility of the "create / edit list" modal on the List tab. */
  isListModalOpen: boolean;
  openListModal: () => void;
  closeListModal: () => void;

  /** Active filter on the Inventory tab. */
  inventoryFilter: InventoryFilter;
  setInventoryFilter: (filter: InventoryFilter) => void;
};

/**
 * Global UI-only state.
 *
 * This store holds ephemeral interface state (modals, active selections,
 * filters) — NOT server or persisted data. Anything that lives in SQLite or
 * comes from the backend belongs in React Query, not here.
 */
export const useUiStore = create<UiState>((set) => ({
  activeListId: null,
  setActiveListId: (activeListId) => set({ activeListId }),

  isListModalOpen: false,
  openListModal: () => set({ isListModalOpen: true }),
  closeListModal: () => set({ isListModalOpen: false }),

  inventoryFilter: "all",
  setInventoryFilter: (inventoryFilter) => set({ inventoryFilter }),
}));
