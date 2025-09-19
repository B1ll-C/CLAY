import { tblitems, tbllists } from "@/models/schema";
import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";

import AsyncStorage from "expo-sqlite/kv-store";

export const addDummyData = async (db: ExpoSQLiteDatabase) => {
  const value = AsyncStorage.getItemSync("dbInitialized");
  if (value) return;

  console.log("inserting list");

  await db
    .insert(tbllists)
    .values([{ name: "List 1" }, { name: "List 2" }, { name: "List 3" }]);

  await db.insert(tblitems).values([
    { name: "Task 1", list_id: 1, isChecked: false },
    { name: "Task 2", list_id: 1, isChecked: false },
    { name: "Task 3", list_id: 1, isChecked: false },
  ]);

  await db.insert(tblitems).values([
    { name: "Task 1", list_id: 2, isChecked: false },
    { name: "Task 2", list_id: 2, isChecked: false },
    { name: "Task 3", list_id: 2, isChecked: false },
  ]);

  await db.insert(tblitems).values([
    { name: "Task 1", list_id: 3, isChecked: false },
    { name: "Task 2", list_id: 3, isChecked: false },
    { name: "Task 3", list_id: 3, isChecked: false },
  ]);
};
