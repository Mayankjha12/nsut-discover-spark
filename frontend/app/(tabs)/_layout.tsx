import { Tabs } from "expo-router";
import FeatherIcon from "@react-native-vector-icons/feather";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

import { colors } from "@/src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        tabBarStyle: {
          backgroundColor:
            Platform.OS === "web" ? "rgba(15,17,21,0.95)" : "transparent",
          borderTopColor: colors.border,
          borderTopWidth: 1,
          position: Platform.OS === "web" ? "relative" : "absolute",
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarBackground: () =>
          Platform.OS === "web" ? null : (
            <BlurView
              tint="dark"
              intensity={60}
              style={StyleSheet.absoluteFill}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <FeatherIcon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <FeatherIcon name="activity" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color, size }) => (
            <FeatherIcon name="map-pin" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <FeatherIcon name="grid" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
