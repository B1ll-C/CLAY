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

import { ListFormModal } from "@/components/shopping/ListFormModal";
import { ListItemFormModal } from "@/components/shopping/ListItemFormModal";
import { ShoppingItemRow } from "@/components/shopping/ShoppingItemRow";
import {
  useClearChecked,
  useDeleteList,
  useDeleteListItem,
  useGenerateFromAlerts,
  useSetAllChecked,
  useShoppingList,
  useShoppingListItems,
  useToggleListItem,
} from "@/hooks/useShoppingLists";
import type { ShoppingListItemRow } from "@/models/shoppingListItems";

export default function ListDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const { data: list, isLoading } = useShoppingList(id);
  const { data: items = [] } = useShoppingListItems(id);
  const toggle = useToggleListItem();
  const deleteItem = useDeleteListItem();
  const removeList = useDeleteList();
  const setAllChecked = useSetAllChecked();
  const clearChecked = useClearChecked();
  const generate = useGenerateFromAlerts();

  const [renameOpen, setRenameOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShoppingListItemRow | null>(null);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#557C55" />
      </SafeAreaView>
    );
  }

  if (!list || list.deletedAt) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-center text-gray-500">
          This list is no longer available.
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

  const checkedCount = items.filter((item) => item.isChecked).length;
  const hasChecked = checkedCount > 0;
  const allChecked = items.length > 0 && checkedCount === items.length;

  function openEdit(item: ShoppingListItemRow) {
    setEditing(item);
    setFormOpen(true);
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function confirmDeleteList() {
    Alert.alert("Delete list", `Delete “${list?.title}” and all its items?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeList.mutate(id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  function addLowStock() {
    generate.mutate(id, {
      onSuccess: (count) =>
        Alert.alert(
          count > 0 ? "Items added" : "Nothing to add",
          count > 0
            ? `Added ${count} low-stock item${count === 1 ? "" : "s"} from inventory.`
            : "No inventory items are low or out of stock right now.",
        ),
      onError: (e) =>
        Alert.alert("Couldn’t add items", e instanceof Error ? e.message : ""),
    });
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <FontAwesome name="chevron-left" size={20} color="#374151" />
        </TouchableOpacity>
        <View className="flex-row gap-5">
          <TouchableOpacity onPress={() => setRenameOpen(true)} hitSlop={8}>
            <FontAwesome name="pencil" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDeleteList} hitSlop={8}>
            <FontAwesome name="trash-o" size={20} color="#b91c1c" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        renderItem={({ item }) => (
          <ShoppingItemRow
            item={item}
            onToggle={(isChecked) => toggle.mutate({ id: item.id, isChecked })}
            onEdit={() => openEdit(item)}
            onDelete={() => deleteItem.mutate(item.id)}
          />
        )}
        ListHeaderComponent={
          <View className="mb-2">
            <Text className="text-2xl font-bold text-gray-900">{list.title}</Text>
            <Text className="mt-0.5 text-sm text-gray-400">
              {items.length === 0
                ? "No items yet"
                : `${checkedCount} of ${items.length} checked`}
            </Text>

            <TouchableOpacity
              onPress={addLowStock}
              disabled={generate.isPending}
              className="mt-3 flex-row items-center justify-center gap-2 rounded-xl border border-primary py-2.5"
            >
              <FontAwesome name="magic" size={14} color="#557C55" />
              <Text className="font-semibold text-primary-dark">
                {generate.isPending ? "Adding…" : "Add low-stock items"}
              </Text>
            </TouchableOpacity>

            {items.length > 0 ? (
              <View className="mt-3 flex-row gap-3">
                <TouchableOpacity
                  onPress={() =>
                    setAllChecked.mutate({ listId: id, isChecked: !allChecked })
                  }
                  className="flex-1 items-center rounded-xl bg-gray-100 py-2"
                >
                  <Text className="text-sm font-medium text-gray-600">
                    {allChecked ? "Uncheck all" : "Check all"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => clearChecked.mutate(id)}
                  disabled={!hasChecked}
                  className={`flex-1 items-center rounded-xl py-2 ${
                    hasChecked ? "bg-gray-100" : "bg-gray-50"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      hasChecked ? "text-gray-600" : "text-gray-300"
                    }`}
                  >
                    Clear checked
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View className="h-3" />
          </View>
        }
        ListEmptyComponent={
          <View className="mt-16 items-center px-8">
            <FontAwesome name="shopping-cart" size={36} color="#C9D6CB" />
            <Text className="mt-4 text-center text-base font-medium text-gray-500">
              This list is empty
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-400">
              Tap + to add an item, or pull in your low-stock items.
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

      <ListFormModal
        visible={renameOpen}
        initial={list}
        onClose={() => setRenameOpen(false)}
      />
      <ListItemFormModal
        visible={formOpen}
        listId={id}
        initial={editing ?? undefined}
        onClose={() => setFormOpen(false)}
      />
    </SafeAreaView>
  );
}
