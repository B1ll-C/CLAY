import { FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text, TouchableOpacity, View } from "react-native";

import { formatQuantity } from "@/lib/inventory/format";
import type { ShoppingListItemRow } from "@/models/shoppingListItems";

interface ShoppingItemRowProps {
  item: ShoppingListItemRow;
  onToggle: (isChecked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** A single line on a shopping list: checkbox, name + quantity, delete. */
export function ShoppingItemRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: ShoppingItemRowProps) {
  const checked = item.isChecked;
  const showQty = item.quantity !== 1 || item.unit != null;

  function handleToggle() {
    Haptics.selectionAsync().catch(() => {});
    onToggle(!checked);
  }

  return (
    <View className="mb-2 flex-row items-center rounded-2xl bg-white px-3 py-3 shadow-sm">
      <TouchableOpacity onPress={handleToggle} hitSlop={8} className="pr-3">
        <FontAwesome
          name={checked ? "check-circle" : "circle-o"}
          size={24}
          color={checked ? "#557C55" : "#C9D6CB"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onEdit}
        activeOpacity={0.7}
        className="flex-1 pr-2"
      >
        <Text
          className={`text-base ${
            checked ? "text-gray-400 line-through" : "text-gray-900"
          }`}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {showQty ? (
          <Text className="text-xs text-gray-400">
            {formatQuantity(item.quantity, item.unit)}
          </Text>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity onPress={onDelete} hitSlop={8} className="pl-1">
        <FontAwesome name="trash-o" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}
