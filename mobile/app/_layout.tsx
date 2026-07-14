import migrations from "@/drizzle/migrations";
import "@/global.css";
import { queryClient } from "@/lib/queryClient";
import { HttpSyncTransport, syncEngine } from "@/lib/sync";
import { db } from "@/models/db";
import { useAuthStore } from "@/store/authStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack, useRouter, useSegments } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { Suspense, useEffect } from "react";
import { ActivityIndicator } from "react-native";

export const DATABASE_NAME = "clay";

/**
 * Hydrates the session on launch, lights up `syncEngine`'s HTTP transport once
 * signed in (offline-only otherwise, per `SyncEngine`'s doc comment), and
 * bounces a signed-out user out of `(tabs)` back to the login screen.
 */
function AuthBootstrap() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    syncEngine.setTransport(
      status === "signedIn" ? new HttpSyncTransport() : null,
    );
  }, [status]);

  useEffect(() => {
    if (status === "hydrating") return;
    if (status === "signedOut" && segments[0] === "(tabs)") {
      router.replace("/(auth)/login");
    }
  }, [status, segments, router]);

  return null;
}

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
          <AuthBootstrap />
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
