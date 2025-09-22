import { TaskController } from "@/controller/ShoppingListController";
import { ListItem, ShoppingList } from "@/types";
import React, { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";

export default function NotepadChecklist({
  title,
  list,
  id,
  onUpdate,
  isNew,
}: ShoppingList & { isNew?: boolean }) {
  const [editMode, setEditMode] = useState(isNew || false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const list_id = id;

  // local items with DB IDs
  const [items, setItems] = useState<ListItem[]>(list);

  // editable text, built from items
  const [note, setNote] = useState(items.map((i) => i.item).join("\n"));

  const toggleCheck = (id: number, isChecked: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isChecked } : item))
    );
    TaskController.checkList(id, isChecked);
  };

  const handleToggleEdit = async () => {
    if (title != currentTitle) {
      console.log("Title Updated");
      TaskController.updateList(id, currentTitle);
    }
    if (editMode) {
      const newLines = note.split("\n").filter((line) => line.trim() !== "");

      const seenIds = new Set();

      const updatedItems = await Promise.all(
        newLines.map(async (line) => {
          // Try to find by item text
          const existing = items.find((it) => it.item === line);

          if (!existing) {
            // CREATE
            console.log(`item inserted ${line}`);
            const item = await TaskController.addItem(list_id, line);
            return { id: item.id, item: line, isChecked: false };
          }

          // Keep track of this ID so we don’t delete it later
          seenIds.add(existing.id);

          // If text changed, update it
          if (existing.item !== line) {
            console.log(`updated ${line} # ${existing.id}`);
            await TaskController.updateItem(existing.id, line);
            return { ...existing, item: line };
          }

          // No change
          return existing;
        })
      );

      // DELETE items not in the newLines
      const deletedItems = items.filter((item) => !seenIds.has(item.id));
      await Promise.all(
        deletedItems.map(async (item) => {
          if (item.id > 0) {
            console.log(`deleted ${item.item} # ${item.id}`);
            await TaskController.deleteItem(item.id);
          }
        })
      );

      // Update state
      setItems(updatedItems);
      onUpdate?.();
    }

    setEditMode(!editMode);
  };

  return (
    <View className="flex-1 p-6 bg-gray-200 w-full rounded-lg">
      {/* Header */}
      <View className="flex-row items-center justify-between gap-3 mb-4 px-4">
        <View className="flex-1">
          {editMode ? (
            <TextInput
              className="text-base font-medium bg-white rounded-md px-3 py-2 border border-gray-300"
              value={currentTitle}
              placeholder="Enter title"
              onChangeText={setCurrentTitle}
            />
          ) : (
            <View>
              <Text className="text-base font-semibold text-gray-800">
                {currentTitle}
              </Text>
              <Text className="text-sm text-gray-500">ID: {id}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={handleToggleEdit}
          className="bg-primary px-4 py-2 rounded-md active:opacity-80"
          android_ripple={{ color: "#ffffff20" }}
        >
          <Text className="text-white text-sm font-semibold">
            {editMode ? "Done" : "Edit"}
          </Text>
        </Pressable>
      </View>

      {editMode ? (
        // ✏️ Edit Mode
        <TextInput
          className="w-full bg-white p-3 rounded-lg"
          value={note}
          onChangeText={setNote}
          placeholder="Write your notes here..."
          multiline
        />
      ) : (
        // ✅ View Mode
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()} // convert number → string for React key
          renderItem={({ item }) => (
            <View className="flex-row items-center mb-2">
              <BouncyCheckbox
                size={25}
                fillColor="red"
                unFillColor="#FFFFFF"
                iconStyle={{ borderColor: "red" }}
                innerIconStyle={{ borderWidth: 2 }}
                isChecked={item.isChecked}
                text={item.item}
                textStyle={{
                  textDecorationLine: item.isChecked ? "line-through" : "none",
                  color: item.isChecked ? "#9ca3af" : "#000",
                  fontSize: 16,
                }}
                onPress={(isChecked: boolean) =>
                  toggleCheck(item.id, isChecked)
                }
              />
            </View>
          )}
        />
      )}
    </View>
  );
}
