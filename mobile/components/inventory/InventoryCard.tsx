import { FontAwesome } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { InventoryItemView } from "@/controller/InventoryController";
import { alertStatuses } from "@/lib/inventory/alerts";
import { expiryLabel, formatQuantity } from "@/lib/inventory/format";
import { AlertBadge } from "./AlertBadge";

interface InventoryCardProps {
  item: InventoryItemView;
  onPress: () => void;
}

const LOCATION_ICON = {
  pantry: "archive",
  fridge: "snowflake-o",
  freezer: "snowflake-o",
  other: "inbox",
} as const;

/** A single inventory row in the list: product, on-hand quantity, alerts. */
export function InventoryCard({ item, onPress }: InventoryCardProps) {
  const statuses = alertStatuses(item);
  const expiry = expiryLabel(item.expirationDate);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mb-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {item.product?.name ?? "Unnamed item"}
          </Text>
          {item.product?.brand ? (
            <Text className="text-xs text-gray-400" numberOfLines={1}>
              {item.product.brand}
            </Text>
          ) : null}
          <View className="mt-1 flex-row items-center gap-1">
            <FontAwesome
              name={LOCATION_ICON[item.location]}
              size={11}
              color="#9CA3AF"
            />
            <Text className="text-xs capitalize text-gray-400">
              {item.location}
            </Text>
            {expiry ? (
              <Text className="text-xs text-gray-400"> · {expiry}</Text>
            ) : null}
          </View>
        </View>
        <Text className="text-lg font-bold text-primary-dark">
          {formatQuantity(item.quantity, item.unit)}
        </Text>
      </View>

      {statuses.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {statuses.map((status) => (
            <AlertBadge key={status} status={status} compact />
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
