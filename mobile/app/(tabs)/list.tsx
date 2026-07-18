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

import { ListCard } from "@/components/shopping/ListCard";
import { ListFormModal } from "@/components/shopping/ListFormModal";
import { useDeleteList, useShoppingLists } from "@/hooks/useShoppingLists";
import { useSyncStatus } from "@/hooks/useSyncStatus";

export default function Lists() {
  const router = useRouter();
  const { data: lists = [], isLoading, isError, refetch } = useShoppingLists();
  const deleteList = useDeleteList();
  const { sync, isSyncing } = useSyncStatus();
  const [formOpen, setFormOpen] = useState(false);

  function openList(id: number) {
    router.push({
      pathname: "/(tabs)/ListDetails/[id]",
      params: { id: String(id) },
    });
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
        <Text className="text-2xl font-bold text-gray-900">Lists</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#557C55" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-gray-500">
            Couldn&apos;t load your lists.
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
          data={lists}
          keyExtractor={(list) => String(list.id)}
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
            <ListCard
              list={item}
              onPress={() => openList(item.id)}
              onDelete={() => deleteList.mutate(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="mt-24 items-center px-8">
              <FontAwesome name="list-ul" size={40} color="#C9D6CB" />
              <Text className="mt-4 text-center text-base font-medium text-gray-500">
                No lists yet
              </Text>
              <Text className="mt-1 text-center text-sm text-gray-400">
                Tap + to start your first shopping list.
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

      <ListFormModal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={openList}
      />
    </SafeAreaView>
  );
}
