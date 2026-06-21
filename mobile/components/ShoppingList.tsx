import { ListItem, ShoppingList } from "@/types";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import React, { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";

export const DATABASE_NAME = "tasks";

export default function NotepadChecklist({
  title,
  list,
  id,
  onUpdate,
}: ShoppingList) {
  const expoDb = openDatabaseSync(DATABASE_NAME);
  const db = drizzle(expoDb);

  const [editMode, setEditMode] = useState(false);

  // local items with DB IDs
  const [items, setItems] = useState<ListItem[]>(list);

  // editable text, built from items
  const [note, setNote] = useState(items.map((i) => i.name).join("\n"));

  const toggleCheck = (id: number, isChecked: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isChecked } : item))
    );
  };

  const handleToggleEdit = async () => {
    if (editMode) {
      const newLines = note.split("\n").filter((line) => line.trim() !== "");

      const updatedItems = await Promise.all(
        newLines.map(async (line, i) => {
          const existing = items[i]; // using current state

          // if the line matches the old text, keep status
          if (existing && existing.name === line) {
            return { ...existing, name: line };
          }

          const id = existing ? existing.id : -(Date.now() + i);
          console.log("New/changed line:", line);
          console.log("New/changed id:", id);
          console.log(id > 0 ? "Updating" : "Adding new id");

          if (id > 0) {
            // Update existing row in DB
            // await db
            //   .update(tblitems)
            //   .set({ name: line }) // example: mark as checked
            //   .where(eq(tblitems.id, id));
            console.log("updating");
          } else {
            // await db
            //   .insert(tblitems)
            //   .values([{ name: "Task 1", list_id: 1, isChecked: false }]);
            console.log("new list");
          }
          onUpdate?.();

          // Return updated item (temporary negative id if new)
          return {
            id,
            name: line,
            isChecked: false,
          };
        })
      );

      setItems(updatedItems);
    }

    setEditMode(!editMode);
  };

  return (
    <View className="flex-1 p-6 bg-gray-200 w-full rounded-lg">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-medium">{title}</Text>
        <Text className="text-lg font-medium">{id}</Text>

        <Pressable
          onPress={handleToggleEdit}
          className="bg-primary px-4 py-2 rounded-lg"
        >
          <Text className="text-white text-center">
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
                text={item.name}
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
