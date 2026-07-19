import { FontAwesome } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { SwipeToDelete } from "@/components/common/SwipeToDelete";
import type { Store } from "@/models/stores";

interface StoreCardProps {
  store: Store;
  onPress: () => void;
  onDelete: () => void;
}

/** A store in the Stores modal: name, address, and swipe-to-delete. */
export function StoreCard({ store, onPress, onDelete }: StoreCardProps) {
  return (
    <SwipeToDelete onDelete={onDelete} spacing={12}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
      >
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-primary-light">
          <FontAwesome name="building-o" size={16} color="#557C55" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {store.name}
          </Text>
          {store.address ? (
            <Text className="mt-0.5 text-xs text-gray-400" numberOfLines={1}>
              {store.address}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </SwipeToDelete>
  );
}
