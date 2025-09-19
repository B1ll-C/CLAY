import { expo } from "@/models/db";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin/build/useDrizzleStudio";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

function Index() {
  useDrizzleStudio(expo);
  const router = useRouter();
  return (
    <View className="flex-1 bg-white items-center justify-center">
      {/* Top Section */}
      <View className="absolute top-0 w-full h-1/2 bg-[#8eb692] items-center ">
        {/* Large Circle */}
        <View className="w-32 h-32 bg-gray-200 rounded-full mt-10" />

        {/* Title */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl text-white font-bold mt-6 tracking-widest">
            CLAY
          </Text>
        </View>

        {/* Wave Effect - circles on edge */}
        <View className="absolute -bottom-16 w-full items-center overflow-hidden">
          <View className="flex-row justify-center">
            <View className="w-32 h-32 bg-white rounded-full" />
            <View className="w-32 h-32 bg-[#8eb692] rounded-full" />
            <View className="w-32 h-32 bg-white rounded-full" />
            <View className="w-32 h-32 bg-[#8eb692] rounded-full" />
            <View className="w-32 h-32 bg-white rounded-full" />
            <View className="w-32 h-32 bg-[#8eb692] rounded-full" />
          </View>
        </View>
      </View>

      {/* Button */}
      <View className="absolute bottom-40 items-center">
        <TouchableOpacity
          className="bg-[#8eb692] px-6 py-3 rounded-full"
          onPress={() => router.push("/(tabs)/product")}
        >
          <Text className="text-white text-lg font-bold">Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Index;
