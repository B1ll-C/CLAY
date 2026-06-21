import ProductCard from "@/components/ProductCard";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Product() {
  const products = [
    {
      id: 1,
      name: "Apples",
      price: "$4.99",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      name: "Bananas",
      price: "$2.49",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 3,
      name: "Oranges",
      price: "$3.19",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 4,
      name: "Mangoes",
      price: "$5.99",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 5,
      name: "Grapes",
      price: "$6.49",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 6,
      name: "Pineapples",
      price: "$3.99",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 7,
      name: "Pineapples",
      price: "$3.99",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 8,
      name: "Pineapples",
      price: "$3.99",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 9,
      name: "Pineapples",
      price: "$3.99",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 10,
      name: "Pineapples",
      price: "$3.99",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 11,
      name: "Pineapples",
      price: "$3.99",
      image: "https://via.placeholder.com/150",
    },
  ];
  const [search, setSearch] = useState("");
  const filtered = products.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <ScrollView className="flex-1 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 m-4">
          <TextInput
            className="flex-1 ml-2 text-base w-1/2"
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
          <View className="w-10 h-10 bg-gray-300 rounded-full items-center justify-center">
            <FontAwesome
              name="ellipsis-v"
              size={16}
              color="#555"
              onPress={() => setModalVisible(true)}
            />
          </View>
        </View>
        <SafeAreaView className="flex-row flex-wrap gap-4 justify-center p-4">
          {filtered.map((item) => (
            <ProductCard
              key={item.id}
              name={item.name}
              price={item.price}
              image={item.image}
              onPress={() => {
                router.push({
                  pathname: "/(tabs)/ProductDetails/details",
                  params: { id: item.id, name: item.name, price: item.price },
                });
              }}
            />
          ))}
        </SafeAreaView>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true} // ✅ important for background visibility
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-[80%] p-6 bg-white rounded-2xl shadow-lg">
            <Text className="mb-4 text-center text-lg font-semibold">
              Transparent Modal 🎉
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default Product;
