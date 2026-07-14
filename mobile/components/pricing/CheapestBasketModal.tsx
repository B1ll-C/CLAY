import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OptionChips } from "@/components/inventory/OptionChips";
import { useCheapestBasket } from "@/hooks/usePrices";
import { formatPrice } from "@/lib/pricing/format";
import { BASKET_MODES, type BasketMode } from "@clay/shared";

interface CheapestBasketModalProps {
  visible: boolean;
  onClose: () => void;
  listId: number;
}

const MODE_LABEL: Record<BasketMode, string> = {
  minimize_cost: "Lowest cost",
  minimize_trips: "Fewest trips",
};

/** "Cheapest basket" — group a list's items across stores and total the trip(s). */
export function CheapestBasketModal({
  visible,
  onClose,
  listId,
}: CheapestBasketModalProps) {
  const [mode, setMode] = useState<BasketMode>("minimize_cost");
  const { data: result, isLoading } = useCheapestBasket(listId, mode, {
    enabled: visible,
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <FontAwesome name="chevron-left" size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">
            Cheapest basket
          </Text>
          <View style={{ width: 20 }} />
        </View>

        <View className="px-4">
          <OptionChips
            options={BASKET_MODES}
            value={mode}
            onChange={setMode}
            labelFor={(m) => MODE_LABEL[m]}
          />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#557C55" />
          </View>
        ) : !result || result.pricedItemCount === 0 ? (
          <View className="mt-16 items-center px-8">
            <FontAwesome name="tags" size={36} color="#C9D6CB" />
            <Text className="mt-4 text-center text-base font-medium text-gray-500">
              No priced items yet
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-400">
              Record store prices for this list&apos;s items to compare a basket.
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
            <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-gray-600">
                  Total ({result.pricedItemCount} of {result.totalItemCount} items)
                </Text>
                <Text className="text-xl font-bold text-primary-dark">
                  {formatPrice(result.total)}
                </Text>
              </View>
              {result.estimatedSavings != null && result.estimatedSavings > 0 ? (
                <Text className="mt-1 text-sm text-primary-dark">
                  Saves {formatPrice(result.estimatedSavings)} vs. one store (
                  {result.singleStoreBaseline?.store.name})
                </Text>
              ) : result.singleStoreBaseline == null ? (
                <Text className="mt-1 text-sm text-gray-400">
                  No single store covers every priced item.
                </Text>
              ) : null}
            </View>

            {result.options.map((option) => (
              <View
                key={option.store.id}
                className="mb-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-gray-900">
                    {option.store.name}
                  </Text>
                  <Text className="text-base font-bold text-gray-900">
                    {formatPrice(option.subtotal)}
                  </Text>
                </View>
                {!option.coversAllPricedItems ? (
                  <Text className="mt-0.5 text-xs text-gray-400">
                    Covers {option.items.length} of {result.pricedItemCount} priced items
                  </Text>
                ) : null}
                <View className="mt-2">
                  {option.items.map((line) => (
                    <View
                      key={line.itemId}
                      className="flex-row items-center justify-between py-1"
                    >
                      <Text className="flex-1 pr-2 text-sm text-gray-600" numberOfLines={1}>
                        {line.name}
                        {line.quantity !== 1 ? ` ×${line.quantity}` : ""}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {formatPrice(line.lineTotal)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {result.unpricedItems.length > 0 ? (
              <View className="mt-2 rounded-2xl bg-white p-4 shadow-sm">
                <Text className="mb-2 text-sm font-medium text-gray-600">
                  Not included
                </Text>
                {result.unpricedItems.map((item) => (
                  <Text key={item.itemId} className="py-0.5 text-sm text-gray-400">
                    {item.name} —{" "}
                    {item.reason === "not_linked_to_product"
                      ? "not linked to a product"
                      : "no tracked price"}
                  </Text>
                ))}
              </View>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
