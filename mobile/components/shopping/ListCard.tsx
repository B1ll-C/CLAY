import { FontAwesome } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { ShoppingListSummary } from "@/controller/ShoppingListController";

interface ListCardProps {
  list: ShoppingListSummary;
  onPress: () => void;
}

/** A shopping list on the hub: title, progress, and a completion bar. */
export function ListCard({ list, onPress }: ListCardProps) {
  const { itemCount, checkedCount } = list;
  const ratio = itemCount > 0 ? checkedCount / itemCount : 0;
  const allDone = itemCount > 0 && checkedCount === itemCount;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mb-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text
            className="text-base font-semibold text-gray-900"
            numberOfLines={1}
          >
            {list.title}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-400">
            {itemCount === 0
              ? "No items yet"
              : `${checkedCount} of ${itemCount} checked`}
          </Text>
        </View>
        {list.isShared ? (
          <FontAwesome name="users" size={14} color="#8FB996" />
        ) : null}
      </View>

      <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <View
          className={`h-full rounded-full ${allDone ? "bg-primary-dark" : "bg-primary"}`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </View>
    </TouchableOpacity>
  );
}
