import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import type { AlertStatus } from "@/lib/inventory/alerts";
import type { InventoryFilter } from "@/store/uiStore";
import { INVENTORY_FILTERS } from "./alertMeta";

interface InventoryFilterBarProps {
  value: InventoryFilter;
  onChange: (filter: InventoryFilter) => void;
  /** Per-alert counts; the "All" chip shows the total. */
  counts: Record<AlertStatus, number>;
  total: number;
}

/** Horizontal filter chips for the Inventory tab, each with a count badge. */
export function InventoryFilterBar({
  value,
  onChange,
  counts,
  total,
}: InventoryFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-grow-0"
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}
    >
      {INVENTORY_FILTERS.map(({ value: filter, label }) => {
        const selected = filter === value;
        const count = filter === "all" ? total : counts[filter as AlertStatus];
        return (
          <TouchableOpacity
            key={filter}
            activeOpacity={0.8}
            onPress={() => onChange(filter)}
            className={`flex-row items-center gap-2 rounded-full border px-4 py-2 ${
              selected ? "border-primary bg-primary" : "border-gray-200 bg-white"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selected ? "text-white" : "text-gray-700"
              }`}
            >
              {label}
            </Text>
            <View
              className={`min-w-5 items-center rounded-full px-1.5 ${
                selected ? "bg-white/30" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selected ? "text-white" : "text-gray-500"
                }`}
              >
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
