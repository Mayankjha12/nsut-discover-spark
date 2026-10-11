import { Tabs } from "expo-router";
import Feather from "@react-native-vector-icons/feather";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/src/theme";
export default function TabsLayout() {
  const { width } = useWindowDimensions(), inset = useSafeAreaInsets();
  return <Tabs screenOptions={{ headerShown: false, tabBarPosition: width >= 1000 ? "left" : "bottom", tabBarActiveTintColor: "#FF9298", tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, ...(width < 1000 ? { height: 66 + inset.bottom, paddingTop: 6, paddingBottom: Math.max(10, inset.bottom) } : {}) }, tabBarLabelStyle: { fontSize: width < 360 ? 11 : 12, lineHeight: 16, fontWeight: "600" } }}>
    {([['index','Today','sun'],['attendance','Attendance','activity'],['timetable','Timetable','calendar'],['rooms','Rooms','map-pin'],['more','More','grid']] as const).map(([name,title,icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarAccessibilityLabel: title, tabBarIcon: ({ color, size }) => <Feather name={icon} color={color} size={size}/> }}/>) }
  </Tabs>;
}
