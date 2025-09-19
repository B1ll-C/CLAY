import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
function Details() {
  const params = useLocalSearchParams();
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Text className="text-2xl font-bold mb-4">Product Details</Text>
      <Text className="text-lg">ID: {params.id}</Text>
      <Text className="text-lg">Name: {params.name}</Text>
      <Text className="text-lg">Price: {params.price}</Text>
    </View>
  );
}

export default Details;
