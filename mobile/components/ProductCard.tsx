import { Text, TouchableOpacity, View } from "react-native";

import { SwipeToDelete } from "@/components/common/SwipeToDelete";
import type { Product } from "@/models/products";

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onDelete: () => void;
}

/** A single catalog row on the Groceries tab: name, brand, category, barcode. */
export default function ProductCard({ product, onPress, onDelete }: ProductCardProps) {
  return (
    <SwipeToDelete onDelete={onDelete} spacing={12}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className="rounded-2xl bg-white p-4 shadow-sm"
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
            {product.barcode ? (
              <Text className="mt-1 text-xs text-gray-400" numberOfLines={1}>
                {product.barcode}
              </Text>
            ) : null}
          </View>
          {product.category ? (
            <View className="rounded-full bg-primary-light px-3 py-1">
              <Text className="text-xs font-medium text-primary-dark" numberOfLines={1}>
                {product.category}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </SwipeToDelete>
  );
}
