import { Image, Text, TouchableOpacity, View } from "react-native";

type ProductCardProps = {
  name: string;
  price: string;
  image: string;
  onPress?: () => void;
};

export default function ProductCard({
  name,
  price,
  image,
  onPress,
}: ProductCardProps) {
  return (
    <TouchableOpacity
      //   onPress={onPress}
      className="w-32 bg-white rounded-2xl shadow-md p-4 mb-4"
      activeOpacity={0.8}
    >
      {/* Product Image */}
      <View className="items-center">
        <Image
          source={{ uri: image }}
          className="w-40 h-40 rounded-xl"
          resizeMode="cover"
        />
      </View>

      {/* Product Info */}
      <View className="mt-3">
        <Text className="text-lg font-semibold text-gray-800" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-gray-600 text-xs font-bold mt-1">
          9T4X7A2LQ8M1B6C3D5E
        </Text>
        <Text className="text-green-600 text-base font-bold mt-1">{price}</Text>
      </View>

      {/* Add to Cart Button */}
      <TouchableOpacity
        className="mt-4 bg-primary py-2 rounded-xl"
        onPress={onPress}
      >
        <Text className="text-white text-center font-semibold">Details</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
