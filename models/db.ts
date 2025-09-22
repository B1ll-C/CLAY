import * as schema from "@/models/index"; // we'll create this
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";

// open SQLite db
export const expo = SQLite.openDatabaseSync("clay");
// useDrizzleStudio(expo);

expo.execSync("PRAGMA foreign_keys = ON;");

// drizzle connection
export const db = drizzle(expo, { schema });
