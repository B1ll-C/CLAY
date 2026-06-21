import NoteCard from "@/components/NoteCard";
import SList from "@/components/ShoppingList";
import { TaskController } from "@/controller/ShoppingListController";
import { ListItems } from "@/models/schema";
import { ShoppingList } from "@/types";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface Section {
  id: number;
  title: string; // list name or fallback
  data: ListItems[];
}
function List() {
  const notes = [
    { id: "1", name: "milk", isChecked: true },
    { id: "2", name: "bread", isChecked: true },
    { id: "3", name: "Coffee", isChecked: true },
    { id: "4", name: "Coffee", isChecked: true },
    { id: "5", name: "Coffee", isChecked: true },
    { id: "6", name: "Coffee", isChecked: true },
    { id: "7", name: "Coffee", isChecked: true },
    { id: "8", name: "Coffee", isChecked: true },
    { id: "9", name: "Coffee", isChecked: true },
    { id: "10", name: "Coffee", isChecked: true },
    { id: "11", name: "Coffee", isChecked: true },
    { id: "12", name: "Coffee", isChecked: true },
  ];
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeList, setActiveList] = useState<ShoppingList>();
  const handleOnPress = (shoppingList: ShoppingList) => {
    console.log("executed");
    console.log("Pressed:", shoppingList.title);
    console.log("List items:", shoppingList.list);
    setModalVisible(true);
    setActiveList(shoppingList);
    console.log("Active List", activeList);
  };

  // const { data } = useLiveQuery(
  //   drizzleDb
  //     .select()
  //     .from(tblitems)
  //     .leftJoin(tbllists, eq(tblitems.list_id, tbllists.id)),
  //   [refreshKey] // dependency array
  // );

  // const data = null;
  // const sections: Section[] = useMemo(() => {
  //   if (!data) return [];

  //   // Group by list_id but store list name as title
  //   const grouped: Record<
  //     string,
  //     { id: number; title: string; data: ListItems[] }
  //   > = {};

  //   data.forEach((row) => {
  //     const listId = row.tbllists?.id?.toString() ?? "uncategorized";
  //     const listName = row.tbllists?.name ?? "Uncategorized";

  //     if (!grouped[listId]) {
  //       grouped[listId] = {
  //         id: row.tbllists?.id || 0,
  //         title: listName,
  //         data: [],
  //       };
  //     }

  //     grouped[listId].data.push({
  //       ...row.tblitems,
  //       id: row.tblitems.id, // <-- force id to string
  //     });
  //   });

  //   return Object.values(grouped);
  // }, [data]);

  // console.log(sections);
  // // try {
  // //   console.log(sections[0].title);
  // // } catch (error) {
  // //   console.error(error);
  // // }

  return (
    <SafeAreaView className="flex-1  bg-gray-200 px-6 py-6 ">
      <ScrollView>
        <View className="flex-row  flex-wrap gap-4 justify-center items-center ">
          {/* {Array.from({ length: 30 }, (_, i) => (
            <NoteCard
              key={i}
              title={`Groceries ${i + 1}`}
              list={notes}
              onPress={() =>
                handleOnPress({
                  title: `Groceries ${i + 1}`,
                  list: notes,
                })
              }
            />
          ))} */}

          {/* {sections.map((section, index) => (
            <NoteCard
              key={section.title + index} // ensure a unique key
              title={section.title}
              list={section.data}
              onPress={() =>
                handleOnPress({
                  id: section.id,
                  title: section.title,
                  list: section.data,
                })
              }
            />
          ))} */}

          <NoteCard
            key={1}
            title="title"
            list={[]}
            onPress={() => {
              handleOnPress({
                id: 1,
                title: "eweq",
                list: [],
              });
            }}
          />
        </View>
      </ScrollView>

      <Pressable
        onPress={() => {
          try {
            TaskController.add("test");
            console.log("Task added successfully ✅");
          } catch (error) {
            console.error("Failed to add task ❌", error);
          }
        }}
        className="absolute bottom-8 right-8 bg-blue-500 rounded-full p-4 shadow-lg"
      >
        <Text className="text-white text-2xl font-bold">+</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 w-full ">
          {/* <Text className="mb-4 text-center text-lg font-semibold">
              Transparent Modal 🎉
            </Text> */}
          <SList
            title="Shopping List"
            list={activeList?.list || []}
            id={activeList?.id || 0}
            onUpdate={() => setRefreshKey((prev) => prev + 1)}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default List;
