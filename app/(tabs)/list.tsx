import NoteCard from "@/components/NoteCard";
import ShoppingListCard from "@/components/ShoppingList";
import { TaskController } from "@/controller/ShoppingListController";
import { ListItems } from "@/models/schema";
import { ShoppingList } from "@/types";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface Section {
  id: number;
  title: string; // list name or fallback
  data: ListItems[];
}
function List() {
  const notes = [
    // { id: 1, name: "milk", isChecked: true },
    // { id: 2, name: "bread", isChecked: true },
    // { id: 3, name: "coffee", isChecked: true },
    // { id: 4, name: "eggs", isChecked: true },
    // { id: 5, name: "cheese", isChecked: true },
    // { id: 6, name: "butter", isChecked: true },
    // { id: 7, name: "apples", isChecked: true },
    // { id: 8, name: "bananas", isChecked: true },
    // { id: 9, name: "rice", isChecked: true },
    // { id: 10, name: "pasta", isChecked: true },
    // { id: 11, name: "yogurt", isChecked: true },
    // { id: 12, name: "tea", isChecked: true },
    {
      // deletedAt: null,
      id: 15,
      isChecked: false,
      item: "New",
      lt_id: 22,
    },
  ];

  const [refreshKey, setRefreshKey] = useState(0);
  const [lists, setLists] = useState<any[]>([]);
  const fetchData = async () => {
    const data = await TaskController.getAll(); // call your getAll
    console.log(data);
    setLists(data);
  };
  useEffect(() => {
    fetchData();
  }, []);

  const [modalVisible, setModalVisible] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [activeList, setActiveList] = useState<ShoppingList>();

  const handleOnPress = (
    shoppingList: ShoppingList,
    createdNow: boolean = false
  ) => {
    console.log("executed");
    console.log("Pressed:", shoppingList.title);
    console.log("List items:", shoppingList.list);
    setModalVisible(true);
    setActiveList(shoppingList);
    console.log("Active List", activeList);
    setIsNew(createdNow);
    fetchData();
  };

  const handleListCreation = async () => {
    try {
      let new_list = await TaskController.addList("New List");
      console.log(`New List : ${new_list.task_title} # ${new_list.id}`);
      handleOnPress(
        { id: new_list.id, title: new_list.task_title, list: [] },
        true
      );
    } catch (error) {
      console.error("Failed to add task", error);
    }
  };

  return (
    <SafeAreaView className="flex-1  bg-gray-200 px-6 py-6 ">
      <ScrollView className="">
        <View className="flex-row flex-wrap justify-evenly gap-4">
          {lists.map((note) => {
            console.log("Rendering NoteCard:", {
              // id: note.id,
              // title: note.list_title,
              list: note.list[0],
            });

            return (
              <NoteCard
                key={note.id}
                title={note.list_title}
                list={note.list}
                onPress={() => {
                  console.log("Pressed NoteCard:", {
                    id: note.id,
                    title: note.list_title,
                    list: note.list,
                  });

                  handleOnPress({
                    id: note.id,
                    title: note.list_title,
                    list: note.list,
                  });
                }}
                onLongPress={async () => {
                  Alert.alert(
                    "Delete List",
                    `Are you sure you want to delete "${note.list_title}" ?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          console.log("delete data");
                          TaskController.deleteList(note.id, note.list);
                          fetchData();
                        },
                      },
                    ]
                  );
                }}
              />
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        onPress={handleListCreation}
        className="absolute bottom-8 right-8 bg-blue-500 rounded-full p-4 shadow-lg"
      >
        <Text className="text-white text-2xl font-bold">+</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          fetchData();
          setModalVisible(false);
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/50 w-full ">
          {/* <Text className="mb-4 text-center text-lg font-semibold">
              Transparent Modal 🎉
            </Text> */}
          <ShoppingListCard
            title={activeList?.title || ""}
            list={activeList?.list || []}
            id={activeList?.id || 0}
            onUpdate={() => setRefreshKey((prev) => prev + 1)}
            isNew={isNew}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default List;
