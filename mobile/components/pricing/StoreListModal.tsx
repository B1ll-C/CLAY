import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StoreCard } from "@/components/pricing/StoreCard";
import { StoreFormModal } from "@/components/pricing/StoreFormModal";
import { useDeleteStore, useStores } from "@/hooks/useStores";
import type { Store } from "@/models/stores";

interface StoreListModalProps {
  visible: boolean;
  onClose: () => void;
}

/** Full-screen store CRUD, opened from the Prices hub header. */
export function StoreListModal({ visible, onClose }: StoreListModalProps) {
  const { data: stores = [] } = useStores();
  const deleteStore = useDeleteStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(store: Store) {
    setEditing(store);
    setFormOpen(true);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <FontAwesome name="chevron-left" size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">Stores</Text>
          <View style={{ width: 20 }} />
        </View>

        <FlatList
          data={stores}
          keyExtractor={(store) => String(store.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
          renderItem={({ item }) => (
            <StoreCard
              store={item}
              onPress={() => openEdit(item)}
              onDelete={() => deleteStore.mutate(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="mt-24 items-center px-8">
              <FontAwesome name="building-o" size={40} color="#C9D6CB" />
              <Text className="mt-4 text-center text-base font-medium text-gray-500">
                No stores yet
              </Text>
              <Text className="mt-1 text-center text-sm text-gray-400">
                Tap + to add a store you shop at.
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

        <StoreFormModal
          visible={formOpen}
          initial={editing ?? undefined}
          onClose={() => setFormOpen(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}
