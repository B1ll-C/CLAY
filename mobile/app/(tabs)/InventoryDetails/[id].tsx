import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AlertBadge } from "@/components/inventory/AlertBadge";
import { InventoryAdjustModal } from "@/components/inventory/InventoryAdjustModal";
import { InventoryFormModal } from "@/components/inventory/InventoryFormModal";
import { MovementRow } from "@/components/inventory/MovementRow";
import {
  useAdjustInventoryQuantity,
  useDeleteInventoryItem,
  useInventoryItem,
  useInventoryMovements,
} from "@/hooks/useInventory";
import { alertStatuses } from "@/lib/inventory/alerts";
import { expiryLabel, formatDate, formatQuantity } from "@/lib/inventory/format";

/** A label/value pair in the attributes grid. */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 py-2">
      <Text className="text-xs uppercase tracking-wide text-gray-400">{label}</Text>
      <Text className="mt-0.5 text-base text-gray-800">{value}</Text>
    </View>
  );
}

export default function InventoryDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const { data: item, isLoading } = useInventoryItem(id);
  const { data: movements = [] } = useInventoryMovements(id);
  const adjust = useAdjustInventoryQuantity();
  const remove = useDeleteInventoryItem();

  const [editOpen, setEditOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#557C55" />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-center text-gray-500">
          This item is no longer available.
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

  const statuses = alertStatuses(item);
  const expiry = expiryLabel(item.expirationDate);

  function quickAdjust(delta: number) {
    adjust.mutate({
      id,
      input: { delta, reason: delta > 0 ? "purchase" : "consume" },
    });
  }

  function confirmDelete() {
    Alert.alert("Delete item", `Remove ${item?.product?.name ?? "this item"}?`, [
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
      {/* Header */}
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

      <FlatList
        data={movements}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        renderItem={({ item: movement }) => (
          <MovementRow movement={movement} unit={item.unit} />
        )}
        ListHeaderComponent={
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              {item.product?.name ?? "Unnamed item"}
            </Text>
            {item.product?.brand ? (
              <Text className="text-sm text-gray-400">{item.product.brand}</Text>
            ) : null}

            {statuses.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {statuses.map((status) => (
                  <AlertBadge key={status} status={status} />
                ))}
              </View>
            ) : null}

            {/* Quantity + stepper */}
            <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
              <TouchableOpacity
                onPress={() => quickAdjust(-1)}
                disabled={adjust.isPending || item.quantity <= 0}
                className="h-11 w-11 items-center justify-center rounded-full bg-gray-100"
              >
                <FontAwesome name="minus" size={16} color="#374151" />
              </TouchableOpacity>
              <View className="items-center">
                <Text className="text-3xl font-bold text-primary-dark">
                  {formatQuantity(item.quantity)}
                </Text>
                <Text className="text-xs text-gray-400">
                  {item.unit ?? "on hand"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => quickAdjust(1)}
                disabled={adjust.isPending}
                className="h-11 w-11 items-center justify-center rounded-full bg-primary-light"
              >
                <FontAwesome name="plus" size={16} color="#557C55" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setAdjustOpen(true)}
              className="mt-3 items-center rounded-xl border border-primary py-2.5"
            >
              <Text className="font-semibold text-primary-dark">
                Adjust stock…
              </Text>
            </TouchableOpacity>

            {/* Attributes */}
            <View className="mt-4 flex-row flex-wrap rounded-2xl bg-white px-4 py-2 shadow-sm">
              <Detail
                label="Location"
                value={item.location[0].toUpperCase() + item.location.slice(1)}
              />
              <Detail
                label="Low-stock at"
                value={
                  item.minQuantity != null
                    ? formatQuantity(item.minQuantity, item.unit)
                    : "—"
                }
              />
              <Detail
                label="Expires"
                value={
                  item.expirationDate
                    ? `${formatDate(item.expirationDate)}${expiry ? ` (${expiry})` : ""}`
                    : "—"
                }
              />
              <Detail
                label="Cost / unit"
                value={item.costPerUnit != null ? String(item.costPerUnit) : "—"}
              />
              {item.notes ? (
                <View className="w-full py-2">
                  <Text className="text-xs uppercase tracking-wide text-gray-400">
                    Notes
                  </Text>
                  <Text className="mt-0.5 text-base text-gray-800">
                    {item.notes}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text className="mb-1 mt-6 text-lg font-semibold text-gray-900">
              History
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="py-6 text-center text-sm text-gray-400">
            No movements recorded yet.
          </Text>
        }
      />

      <InventoryFormModal
        visible={editOpen}
        initial={item}
        onClose={() => setEditOpen(false)}
      />
      <InventoryAdjustModal
        visible={adjustOpen}
        item={item}
        onClose={() => setAdjustOpen(false)}
      />
    </SafeAreaView>
  );
}
