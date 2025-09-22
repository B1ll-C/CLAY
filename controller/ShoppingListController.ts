import { db } from "@/models/db"; // import the shared Drizzle instance
import { tbllist_item, tbllist_title } from "@/models/index";
import { eq } from "drizzle-orm";

export const TaskController = {
  getAll: async () => {
    const rows = await db
      .select()
      .from(tbllist_title)
      .innerJoin(tbllist_item, eq(tbllist_title.id, tbllist_item.lt_id));

    const grouped = rows.reduce(
      (acc, row) => {
        const title = row.tbllist_title;
        const item = row.tbllist_item;

        if (!acc[title.id]) {
          acc[title.id] = {
            ...title,
            list: [],
          };
        }

        acc[title.id].list.push(item);
        return acc;
      },
      {} as Record<number, any>
    );

    return Object.values(grouped);
  },

  addList: async (title: string) => {
    const result = await db
      .insert(tbllist_title)
      .values({ list_title: title })
      .returning({
        id: tbllist_title.id,
        task_title: tbllist_title.list_title,
      });

    return result[0];
  },

  updateList: async (id: number, title: string) => {
    await db
      .update(tbllist_title)
      .set({ list_title: title })
      .where(eq(tbllist_title.id, id));
  },
  deleteList: async (id: number, list: any) => {
    await db.delete(tbllist_title).where(eq(tbllist_title.id, id));
  },

  // ITEM

  checkList: async (id: number, isChecked: boolean) => {
    const result = await db
      .update(tbllist_item)
      .set({ isChecked: isChecked })
      .where(eq(tbllist_item.id, id));
  },

  addItem: async (list_id: number, item: string) => {
    const result = await db
      .insert(tbllist_item)
      .values({ item: item, lt_id: list_id })
      .returning({ id: tbllist_item.id });

    return result[0];
  },
  updateItem: async (id: number, item: string) => {
    const result = await db
      .update(tbllist_item)
      .set({ item: item })
      .where(eq(tbllist_item.id, id));
  },

  deleteItem: async (id: number) => {
    const result = await db.delete(tbllist_item).where(eq(tbllist_item.id, id));
  },

  // toggle: async (id: number, completed: boolean) => {
  //   await db.update(tasks).set({ completed }).where(eq(tasks.id, id));
  // },

  // remove: async (id: number) => {
  //   await db.delete(tasks).where(eq(tasks.id, id));
  // },
};
