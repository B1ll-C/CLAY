import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InventoryCard } from "@/components/inventory/InventoryCard";
import { InventoryFilterBar } from "@/components/inventory/InventoryFilterBar";
import { InventoryFormModal } from "@/components/inventory/InventoryFormModal";
import { useDeleteInventoryItem, useInventory } from "@/hooks/useInventory";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { alertCounts, matchesFilter } from "@/lib/inventory/alerts";
import { useUiStore } from "@/store/uiStore";

export default function Inventory() {
  const router = useRouter();
  const { data: items = [], isLoading, isError, refetch } = useInventory();
  const deleteItem = useDeleteInventoryItem();
  const { sync, isSyncing } = useSyncStatus();
  const filter = useUiStore((s) => s.inventoryFilter);
  const setFilter = useUiStore((s) => s.setInventoryFilter);

  const [formOpen, setFormOpen] = useState(false);

  const counts = useMemo(() => alertCounts(items), [items]);
  const visible = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter],
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 pt-3">
        <Text className="text-2xl font-bold text-gray-900">Inventory</Text>
        <TouchableOpacity
          onPress={() => router.push("/scan")}
          activeOpacity={0.85}
          className="flex-row items-center gap-2 rounded-full bg-primary-light px-4 py-2"
        >
          <FontAwesome name="barcode" size={16} color="#557C55" />
          <Text className="font-semibold text-primary-dark">Scan</Text>
        </TouchableOpacity>
      </View>

      <InventoryFilterBar
        value={filter}
        onChange={setFilter}
        counts={counts}
        total={items.length}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#557C55" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-gray-500">
            Couldn&apos;t load your inventory.
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
          data={visible}
          keyExtractor={(item) => String(item.id)}
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
            <InventoryCard
              item={item}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/InventoryDetails/[id]",
                  params: { id: String(item.id) },
                })
              }
              onDelete={() => deleteItem.mutate(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="mt-24 items-center px-8">
              <FontAwesome name="archive" size={40} color="#C9D6CB" />
              <Text className="mt-4 text-center text-base font-medium text-gray-500">
                {items.length === 0
                  ? "No items yet"
                  : "Nothing matches this filter"}
              </Text>
              <Text className="mt-1 text-center text-sm text-gray-400">
                {items.length === 0
                  ? "Tap + to add your first inventory item."
                  : "Try a different filter."}
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

      <InventoryFormModal visible={formOpen} onClose={() => setFormOpen(false)} />
    </SafeAreaView>
  );
}
