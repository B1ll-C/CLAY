import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OptionChips } from "@/components/inventory/OptionChips";
import ProductCard from "@/components/ProductCard";
import { ProductFormModal } from "@/components/product/ProductFormModal";
import { useDeleteProduct, useProducts } from "@/hooks/useProducts";
import { useAuthStore } from "@/store/authStore";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@clay/shared";

export default function Product() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { data: products = [], isLoading, isError, refetch } = useProducts();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (category && product.category !== category) return false;
      if (!query) return true;
      return (
        product.name.toLowerCase().includes(query) ||
        (product.brand?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [products, search, category]);

  function openProduct(id: number) {
    router.push({
      pathname: "/(tabs)/ProductDetails/[id]",
      params: { id: String(id) },
    });
  }

  return (
    <>
      <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 pt-3">
          <Text className="text-2xl font-bold text-gray-900">Groceries</Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.push("/scan")}
              activeOpacity={0.85}
              className="flex-row items-center gap-2 rounded-full bg-primary-light px-4 py-2"
            >
              <FontAwesome name="barcode" size={16} color="#557C55" />
              <Text className="font-semibold text-primary-dark">Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <FontAwesome name="ellipsis-v" size={16} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 mx-4 mt-3">
          <FontAwesome name="search" size={14} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View className="mt-3 px-4">
          <OptionChips
            options={PRODUCT_CATEGORIES}
            value={category}
            onChange={setCategory}
            allowClear
            onClear={() => setCategory(null)}
          />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#557C55" />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-gray-500">
              Couldn&apos;t load the catalog.
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
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 96,
            }}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => openProduct(item.id)}
                onDelete={() => deleteProduct.mutate(item.id)}
              />
            )}
            ListEmptyComponent={
              <View className="mt-24 items-center px-8">
                <FontAwesome name="shopping-basket" size={40} color="#C9D6CB" />
                <Text className="mt-4 text-center text-base font-medium text-gray-500">
                  {products.length === 0
                    ? "No products yet"
                    : "Nothing matches this search"}
                </Text>
                <Text className="mt-1 text-center text-sm text-gray-400">
                  {products.length === 0
                    ? "Tap + to add one, or scan a barcode."
                    : "Try a different search or category."}
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
      </SafeAreaView>

      <ProductFormModal visible={formOpen} onClose={() => setFormOpen(false)} />

      <Modal
        visible={menuOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 items-center justify-center bg-black/50"
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View className="w-[80%] p-6 bg-white rounded-2xl shadow-lg">
            <TouchableOpacity
              className="py-3"
              onPress={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              <Text className="text-center text-lg font-semibold text-red-500">
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
