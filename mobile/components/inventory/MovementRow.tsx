import { Text, View } from "react-native";

import { formatDate, formatQuantity } from "@/lib/inventory/format";
import type { InventoryMovement } from "@/models/inventoryMovements";
import { MOVEMENT_REASON_LABEL } from "./alertMeta";

interface MovementRowProps {
  movement: InventoryMovement;
  unit?: string | null;
}

/** One entry in an item's movement history: reason, signed delta, running total. */
export function MovementRow({ movement, unit }: MovementRowProps) {
  const isUp = movement.delta > 0;
  const sign = isUp ? "+" : "−";
  const magnitude = formatQuantity(Math.abs(movement.delta), unit);

  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 py-3">
      <View className="flex-1 pr-3">
        <Text className="text-sm font-semibold text-gray-800">
          {MOVEMENT_REASON_LABEL[movement.reason]}
        </Text>
        <Text className="mt-0.5 text-xs text-gray-400">
          {formatDate(movement.createdAt)}
          {movement.notes ? ` · ${movement.notes}` : ""}
        </Text>
      </View>
      <View className="items-end">
        <Text
          className={`text-sm font-bold ${isUp ? "text-primary-dark" : "text-red-600"}`}
        >
          {sign}
          {magnitude}
        </Text>
        <Text className="text-xs text-gray-400">
          → {formatQuantity(movement.resultingQuantity, unit)}
        </Text>
      </View>
    </View>
  );
}
