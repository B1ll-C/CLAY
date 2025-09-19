import { getShoppingList } from "@/controller/ShoppingListController";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export function Test_Tab() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getShoppingList();
        console.log("Fetched data:", result); // Debug here
        setData(result);
      } catch (error) {
        console.error("Error in component:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <View>
      <Text>Data length: {data.length}</Text>
    </View>
  );
}

// interface Section {
//   title: string; // list name or fallback
//   data: ListItems[];
// }

// export default function Test_Tab() {
//   const db = useSQLiteContext();
//   const drizzleDb = drizzle(db);
//   useDrizzleStudio(db);

//   const { data } = useLiveQuery(
//     drizzleDb
//       .select()
//       .from(tblitems)
//       .leftJoin(tbllists, eq(tblitems.list_id, tbllists.id))
//   );

//   // console.log(data);

//   // Transform raw data into SectionList format
//   const sections: Section[] = useMemo(() => {
//     if (!data) return [];

//     // Group by list_id but store list name as title
//     const grouped: Record<string, { title: string; data: ListItems[] }> = {};

//     data.forEach((row) => {
//       const listId = row.tbllists?.id?.toString() ?? "uncategorized";
//       const listName = row.tbllists?.name ?? "Uncategorized";

//       if (!grouped[listId]) {
//         grouped[listId] = { title: listName, data: [] };
//       }
//       grouped[listId].data.push(row.tblitems);
//     });

//     return Object.values(grouped);
//   }, [data]);

//   return (
//     <View className="flex-1 items-center justify-center">
//       {/* <Text>{sections[0].title}</Text>
//       {sections[0].data.map((item) => (
//         <Text key={item.id}>{item.name}</Text>
//       ))} */}

//       <Button onPressIn={() => addDummyData(drizzleDb)}>ADD DATA</Button>
//     </View>
//   );
// }
