import { FontAwesome } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { PriceComparisonRow as PriceComparisonRowData } from "@/controller/PriceController";
import { formatPrice, relativeVerified } from "@/lib/pricing/format";

interface PriceComparisonRowProps {
  row: PriceComparisonRowData;
  onPress: () => void;
}

/** One store's price for a product: store, price (+ promo), last verified, cheapest star. */
export function PriceComparisonRow({ row, onPress }: PriceComparisonRowProps) {
  const { price, store, effectivePrice, isPromoActive, isCheapest } = row;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mb-2 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
    >
      <View className="flex-1 flex-row items-center pr-3">
        {isCheapest ? (
          <FontAwesome name="star" size={14} color="#E6C368" style={{ marginRight: 8 }} />
        ) : null}
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {store.name}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-400">
            {relativeVerified(price.lastVerifiedAt)}
            {price.unit ? ` · ${price.unit}` : ""}
          </Text>
        </View>
      </View>

      <View className="items-end">
        {isPromoActive ? (
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs text-gray-400 line-through">
              {formatPrice(price.price)}
            </Text>
            <Text className="text-base font-bold text-red-600">
              {formatPrice(effectivePrice)}
            </Text>
          </View>
        ) : (
          <Text
            className={`text-base font-bold ${isCheapest ? "text-primary-dark" : "text-gray-900"}`}
          >
            {formatPrice(effectivePrice)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
