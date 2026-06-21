import migrations from "@/drizzle/migrations";
import "@/global.css";
import { queryClient } from "@/lib/queryClient";
import { db } from "@/models/db";
import { QueryClientProvider } from "@tanstack/react-query";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { Suspense } from "react";
import { ActivityIndicator } from "react-native";

export const DATABASE_NAME = "clay";

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  return (
    <QueryClientProvider client={queryClient}>
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
          />
        </SQLiteProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
