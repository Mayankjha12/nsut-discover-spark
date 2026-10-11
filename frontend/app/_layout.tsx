import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar, View, Text } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { storage } from "@/src/storage";
import { IMSSessionProvider, useIMSSession } from "@/src/ims-session";
import { Button, ui } from "@/src/components/campus";
export default function RootLayout() {
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const initialize = () => { storage.initialize().then(() => setReady(true)).catch(() => setFailed(true)); };
  useEffect(initialize, []);
  return <ErrorBoundary><SafeAreaProvider><QueryClientProvider client={queryClient}><KeyboardProvider><StatusBar barStyle="light-content" backgroundColor="#0F1115"/>{ready ? <IMSSessionProvider><Routes/></IMSSessionProvider> : <View style={[ui.card, { flex: 1, justifyContent: "center" }]}><Text style={ui.text}>{failed ? "Secure storage could not be prepared. Your data has not been opened." : "Opening NSUT Hub…"}</Text>{failed ? <Button label="Retry" onPress={() => { setFailed(false); initialize(); }}/> : null}</View>}</KeyboardProvider></QueryClientProvider></SafeAreaProvider></ErrorBoundary>;
}

function Routes() {
  const { ready, session, message } = useIMSSession();
  if (!ready) return <View style={[ui.card, { flex: 1, justifyContent: 'center' }]}><Text style={ui.text}>{message || 'Opening NSUT Hub…'}</Text></View>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F1115' } }}>
    <Stack.Screen name="index"/><Stack.Screen name="login"/>
    <Stack.Protected guard={!!session}><Stack.Screen name="(tabs)"/><Stack.Screen name="news"/><Stack.Screen name="results"/></Stack.Protected>
  </Stack>;
}
