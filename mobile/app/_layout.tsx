import migrations from "@/drizzle/migrations";
import "@/global.css";
import { useAutoSync } from "@/hooks/useAutoSync";
import "@/lib/dev/resetLocalDb";
import { queryClient } from "@/lib/queryClient";
import { HttpSyncTransport, syncEngine } from "@/lib/sync";
import { db } from "@/models/db";
import { useAuthStore } from "@/store/authStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack, useRouter, useSegments } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { Suspense, useEffect } from "react";
import { ActivityIndicator, LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const DATABASE_NAME = "clay";

// Known react-native-screens/RN <Modal> race on Android: a modal's content can
// render one frame before its screen's navigation context re-attaches during
// open/close. Cosmetic only — reproduces even with unmodified form modals
// (e.g. InventoryFormModal) that never touch navigation.
// Also purely a dev-reload artifact: hot-reloading while already on a nested
// detail route re-mounts it with no push history, so GO_BACK has nowhere to
// go. Real navigation always reaches these screens via router.push.
LogBox.ignoreLogs([
  "Couldn't find a navigation context",
  "The action 'GO_BACK' was not handled by any navigator",
]);

/**
 * Hydrates the session on launch, lights up `syncEngine`'s HTTP transport once
 * signed in (offline-only otherwise, per `SyncEngine`'s doc comment), fires
 * sync at that engine's documented trigger points (`useAutoSync`), and
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

  useAutoSync();

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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
