import { Text, TouchableOpacity, View } from "react-native";

import type { TrackedProductSummary } from "@/controller/PriceController";
import { formatPrice, relativeVerified } from "@/lib/pricing/format";

interface TrackedProductCardProps {
  summary: TrackedProductSummary;
  onPress: () => void;
}

/** A tracked product on the Prices hub: cheapest price, store count, last verified. */
export function TrackedProductCard({ summary, onPress }: TrackedProductCardProps) {
  const { product, storeCount, cheapestPrice, lastVerifiedAt } = summary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mb-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {product.name}
          </Text>
          {product.brand ? (
            <Text className="text-xs text-gray-400" numberOfLines={1}>
              {product.brand}
            </Text>
          ) : null}
          <Text className="mt-1 text-xs text-gray-400">
            {storeCount} store{storeCount === 1 ? "" : "s"} · {relativeVerified(lastVerifiedAt)}
          </Text>
        </View>
        <Text className="text-lg font-bold text-primary-dark">
          {formatPrice(cheapestPrice)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
