import { FontAwesome } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

import { useAddListItem, useShoppingLists } from "@/hooks/useShoppingLists";
import type { Product } from "@/models/products";

interface ListPickerModalProps {
  visible: boolean;
  /** The product to append to the chosen list. */
  product: Product;
  onClose: () => void;
  /** The product was added to a list. */
  onAdded: () => void;
}

/**
 * Bottom sheet that adds a scanned product to one of the user's shopping lists
 * as a single-quantity item linked by `productId`. Lists are created in the List
 * tab, so this only picks an existing one.
 */
export function ListPickerModal({
  visible,
  product,
  onClose,
  onAdded,
}: ListPickerModalProps) {
  const { data: lists = [], isLoading } = useShoppingLists();
  const addItem = useAddListItem();

  function handlePick(listId: number) {
    addItem.mutate(
      { listId, input: { name: product.name, quantity: 1, productId: product.id } },
      { onSuccess: () => onAdded() },
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[70%] rounded-t-3xl bg-white px-5 pb-8 pt-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900">
              Add to list
            </Text>
            <Pressable onPress={onClose} hitSlop={8} disabled={addItem.isPending}>
              <Text className="text-base text-gray-500">Cancel</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator className="my-8" color="#557C55" />
          ) : lists.length === 0 ? (
            <View className="items-center py-10">
              <FontAwesome name="list" size={36} color="#C9D6CB" />
              <Text className="mt-3 text-center text-base font-medium text-gray-500">
                No lists yet
              </Text>
              <Text className="mt-1 text-center text-sm text-gray-400">
                Create a list in the List tab, then scan to add to it.
              </Text>
            </View>
          ) : (
            <FlatList
              data={lists}
              keyExtractor={(l) => String(l.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handlePick(item.id)}
                  disabled={addItem.isPending}
                  className="flex-row items-center justify-between border-b border-gray-100 py-3.5"
                >
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">
                      {item.title}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
