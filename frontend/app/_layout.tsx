import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { LogBox, StatusBar } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";

LogBox.ignoreAllLogs(true);

// Prewarm icon assets so Android Expo Go doesn't flash a missing-icon
// placeholder.
const ICON_ASSETS = [
  require("../assets/images/icon.png"),
  require("../assets/images/favicon.png"),
  require("../assets/images/adaptive-icon.png"),
];

export default function RootLayout() {
  const [prewarmed, setPrewarmed] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        await Asset.loadAsync(ICON_ASSETS);
      } catch {}
      setPrewarmed(true);
    })();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <StatusBar barStyle="light-content" backgroundColor="#0F1115" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0F1115" } }} />
          </KeyboardProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
