import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PriceComparisonRow } from "@/components/pricing/PriceComparisonRow";
import { PriceFormModal } from "@/components/pricing/PriceFormModal";
import type { PriceComparisonRow as PriceComparisonRowData } from "@/controller/PriceController";
import { usePriceComparison } from "@/hooks/usePrices";
import { useProduct } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/pricing/format";

export default function PricesDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const productId = Number(params.id);

  const { data: product, isLoading: productLoading } = useProduct(productId);
  const { data: rows = [], isLoading: rowsLoading } = usePriceComparison(productId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PriceComparisonRowData | null>(null);

  if (productLoading || rowsLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#557C55" />
      </SafeAreaView>
    );
  }

  if (!product || product.deletedAt) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-center text-gray-500">
          This product is no longer available.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-3 rounded-xl bg-primary px-4 py-2"
        >
          <Text className="font-semibold text-white">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row: PriceComparisonRowData) {
    setEditing(row);
    setFormOpen(true);
  }

  const cheapest = rows[0];
  const priciest = rows[rows.length - 1];
  const savings =
    rows.length > 1 ? priciest.effectivePrice - cheapest.effectivePrice : 0;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <FontAwesome name="chevron-left" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => String(row.price.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        renderItem={({ item }) => (
          <PriceComparisonRow row={item} onPress={() => openEdit(item)} />
        )}
        ListHeaderComponent={
          <View className="mb-3">
            <Text className="text-2xl font-bold text-gray-900">{product.name}</Text>
            {product.brand ? (
              <Text className="mt-0.5 text-sm text-gray-400">{product.brand}</Text>
            ) : null}
            {savings > 0 ? (
              <Text className="mt-2 text-sm font-medium text-primary-dark">
                Save {formatPrice(savings)} at {cheapest.store.name} vs.{" "}
                {priciest.store.name}
              </Text>
            ) : null}
            <View className="h-3" />
          </View>
        }
        ListEmptyComponent={
          <View className="mt-16 items-center px-8">
            <FontAwesome name="tags" size={36} color="#C9D6CB" />
            <Text className="mt-4 text-center text-base font-medium text-gray-500">
              No prices recorded yet
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-400">
              Tap + to record a price at a store.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={openAdd}
        activeOpacity={0.85}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-dark shadow-lg"
      >
        <FontAwesome name="plus" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <PriceFormModal
        visible={formOpen}
        productId={productId}
        initial={editing ?? undefined}
        onClose={() => setFormOpen(false)}
      />
    </SafeAreaView>
  );
}
