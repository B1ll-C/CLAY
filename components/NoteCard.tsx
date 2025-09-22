import { NoteCardProps } from "@/types";
import React from "react";
import { Pressable, Text, View } from "react-native";

// type NoteCardProps = {
//   title: string;
//   list: { text: string; isChecked: boolean }[];
//   onPress?: () => void;
// };

export default function NoteCard({
  title,
  list,
  onPress,
  onLongPress,
}: NoteCardProps) {
  const previewLimit = 3;
  const hasMore = list.length > previewLimit;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="w-36 h-36 bg-white rounded-2xl p-3 shadow"
    >
      {/* Title */}
      <Text
        className="text-base font-bold mb-1"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>

      {/* List preview */}
      <View className="flex-1">
        {list.slice(0, previewLimit).map((item, index) =>
          item.item ? (
            <Text
              key={index}
              className={`text-sm text-gray-600 ${
                item.isChecked ? "line-through text-gray-400" : ""
              }`}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.item}
            </Text>
          ) : null
        )}

        {hasMore && (
          <Text className="text-xl font-bold text-gray-400">...</Text>
        )}
      </View>
    </Pressable>
  );
}
