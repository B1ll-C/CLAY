import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PriceFormModal } from "@/components/pricing/PriceFormModal";
import { StoreListModal } from "@/components/pricing/StoreListModal";
import { TrackedProductCard } from "@/components/pricing/TrackedProductCard";
import { useTrackedProducts } from "@/hooks/usePrices";
import { useSyncStatus } from "@/hooks/useSyncStatus";

export default function Prices() {
  const router = useRouter();
  const { data: products = [], isLoading, isError, refetch } = useTrackedProducts();
  const { sync, isSyncing } = useSyncStatus();
  const [storesOpen, setStoresOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  function openProduct(productId: number) {
    router.push({
      pathname: "/(tabs)/PricesDetails/[id]",
      params: { id: String(productId) },
    });
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
        <Text className="text-2xl font-bold text-gray-900">Prices</Text>
        <TouchableOpacity
          onPress={() => setStoresOpen(true)}
          className="flex-row items-center gap-1.5 rounded-xl bg-white px-3 py-2 shadow-sm"
        >
          <FontAwesome name="building-o" size={14} color="#557C55" />
          <Text className="text-sm font-semibold text-primary-dark">Stores</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#557C55" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-gray-500">
            Couldn&apos;t load tracked prices.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-3 rounded-xl bg-primary px-4 py-2"
          >
            <Text className="font-semibold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(summary) => String(summary.product.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={() => sync()}
              tintColor="#557C55"
              colors={["#557C55"]}
            />
          }
          renderItem={({ item }) => (
            <TrackedProductCard
              summary={item}
              onPress={() => openProduct(item.product.id)}
            />
          )}
          ListEmptyComponent={
            <View className="mt-24 items-center px-8">
              <FontAwesome name="tags" size={40} color="#C9D6CB" />
              <Text className="mt-4 text-center text-base font-medium text-gray-500">
                No tracked prices yet
              </Text>
              <Text className="mt-1 text-center text-sm text-gray-400">
                Tap + to record a product&apos;s price at a store.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        onPress={() => setFormOpen(true)}
        activeOpacity={0.85}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-dark shadow-lg"
      >
        <FontAwesome name="plus" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <StoreListModal visible={storesOpen} onClose={() => setStoresOpen(false)} />
      <PriceFormModal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(productId) => {
          setFormOpen(false);
          openProduct(productId);
        }}
      />
    </SafeAreaView>
  );
}
