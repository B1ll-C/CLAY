import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductFormModal } from "@/components/product/ProductFormModal";
import { useDeleteProduct, useProduct } from "@/hooks/useProducts";

/** A label/value pair in the attributes grid. */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 py-2">
      <Text className="text-xs uppercase tracking-wide text-gray-400">{label}</Text>
      <Text className="mt-0.5 text-base text-gray-800">{value}</Text>
    </View>
  );
}

export default function ProductDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const { data: product, isLoading } = useProduct(id);
  const remove = useDeleteProduct();

  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
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

  function confirmDelete() {
    Alert.alert("Delete product", `Remove ${product?.name ?? "this product"}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => remove.mutate(id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <FontAwesome name="chevron-left" size={20} color="#374151" />
        </TouchableOpacity>
        <View className="flex-row gap-5">
          <TouchableOpacity onPress={() => setEditOpen(true)} hitSlop={8}>
            <FontAwesome name="pencil" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} hitSlop={8}>
            <FontAwesome name="trash-o" size={20} color="#b91c1c" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text className="text-2xl font-bold text-gray-900">{product.name}</Text>
        {product.brand ? (
          <Text className="text-sm text-gray-400">{product.brand}</Text>
        ) : null}

        {product.category ? (
          <View className="mt-3 self-start rounded-full bg-primary-light px-3 py-1">
            <Text className="text-xs font-medium text-primary-dark">
              {product.category}
            </Text>
          </View>
        ) : null}

        <View className="mt-4 flex-row flex-wrap rounded-2xl bg-white px-4 py-2 shadow-sm">
          <Detail label="Unit" value={product.unit ?? "—"} />
          <Detail label="Barcode" value={product.barcode ?? "—"} />
          {product.notes ? (
            <View className="w-full py-2">
              <Text className="text-xs uppercase tracking-wide text-gray-400">
                Notes
              </Text>
              <Text className="mt-0.5 text-base text-gray-800">{product.notes}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/PricesDetails/[id]",
              params: { id: String(product.id) },
            })
          }
          className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-primary py-2.5"
        >
          <FontAwesome name="balance-scale" size={14} color="#557C55" />
          <Text className="font-semibold text-primary-dark">View prices</Text>
        </TouchableOpacity>
      </ScrollView>

      <ProductFormModal
        visible={editOpen}
        initial={product}
        onClose={() => setEditOpen(false)}
      />
    </SafeAreaView>
  );
}
