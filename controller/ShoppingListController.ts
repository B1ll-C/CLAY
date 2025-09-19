import { db } from "@/models/db"; // import the shared Drizzle instance
import { tbllist_title } from "@/models/index";

export const TaskController = {
  getAll: async () => {
    return await db.select().from(tbllist_title);
  },

  add: async (title: string) => {
    await db.insert(tbllist_title).values({ list_title: "test" });
  },

  // add: async (title: string) => {
  //   await db.insert(tasks).values({ title });
  // },

  // toggle: async (id: number, completed: boolean) => {
  //   await db.update(tasks).set({ completed }).where(eq(tasks.id, id));
  // },

  // remove: async (id: number) => {
  //   await db.delete(tasks).where(eq(tasks.id, id));
  // },
};
