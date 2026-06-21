import migrations from "@/drizzle/migrations";
import "@/global.css";
import { db } from "@/models/db";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { Suspense } from "react";
import { ActivityIndicator } from "react-native";

export const DATABASE_NAME = "clay";

export default function RootLayout() {
  const isLoggedIn = true;

  const { success, error } = useMigrations(db, migrations);

  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{
          enableChangeListener: true,
        }}
        useSuspense
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          {/* <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected> */}
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
