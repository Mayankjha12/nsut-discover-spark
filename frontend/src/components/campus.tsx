import { ReactNode, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";
import { colors } from "../theme";
export function Page({ title, subtitle, children, action, testID }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode; testID?: string }) {
  const inset = useSafeAreaInsets(), { width } = useWindowDimensions();
  return <ScrollView testID={testID} style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={{ paddingTop: inset.top + 20, paddingBottom: 36 + inset.bottom }} keyboardShouldPersistTaps="handled"><View style={ui.page}>
    <View style={[ui.pageHead, width < 600 && { flexDirection: "column", alignItems: "stretch" }]}><View style={{ flex: 1, minWidth: 0 }}><Text style={ui.eyebrow}>NSUT HUB</Text><Text accessibilityRole="header" style={ui.title}>{title}</Text>{subtitle ? <Text style={ui.muted}>{subtitle}</Text> : null}</View>{action}</View>{children}
  </View></ScrollView>;
}
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) { return <View style={[ui.card, style]}>{children}</View>; }
export function Button({ label, onPress, secondary, disabled, icon, testID }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean; icon?: React.ComponentProps<typeof Feather>["name"]; testID?: string }) {
  const [focused, setFocused] = useState(false);
  return <Pressable onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [ui.button, secondary && ui.secondary, disabled && { opacity: 0.45 }, pressed && { opacity: 0.75 }, focused && { borderColor: colors.onSurface, borderWidth: 2 }]}>{icon ? <Feather name={icon} size={17} color={secondary ? colors.onSurface : "white"} /> : null}<Text style={[ui.buttonText, secondary && { color: colors.onSurface }]}>{label}</Text></Pressable>;
}
export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "success" | "warning" | "info" }) { return <View style={[ui.badge, { backgroundColor: colors[tone] + "18" }]}><Text style={{ color: tone === "info" ? "#A4C8FF" : tone === "success" ? "#78DCC8" : colors[tone], fontSize: 12, fontWeight: "600" }}>{children}</Text></View>; }
export function Empty({ icon = "inbox", title, message, children }: { icon?: React.ComponentProps<typeof Feather>["name"]; title: string; message: string; children?: ReactNode }) { return <Card><Feather name={icon} color={colors.onBrandTertiary} size={27}/><Text accessibilityRole="header" style={ui.h2}>{title}</Text><Text style={ui.muted}>{message}</Text>{children}</Card>; }
export function Loading() { return <View style={ui.row}><ActivityIndicator color={colors.onBrandTertiary}/><Text style={ui.muted}>Loading your saved data…</Text></View>; }
export function Message({ children }: { children: ReactNode }) { return <Text accessibilityRole="alert" style={ui.message}>{children}</Text>; }
export const ui = StyleSheet.create({
  page: { width: "100%", maxWidth: 1120, alignSelf: "center", paddingHorizontal: 20, gap: 20 },
  pageHead: { flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap" },
  eyebrow: { color: "#B3B8C7", fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  title: { color: colors.onSurface, fontSize: 26, fontWeight: "700", letterSpacing: -0.5, marginBottom: 8 },
  h2: { color: colors.onSurface, fontSize: 18, fontWeight: "600", letterSpacing: -0.3 },
  h3: { color: colors.onSurface, fontSize: 16, fontWeight: "600" },
  text: { color: colors.onSurfaceSecondary, fontSize: 15, lineHeight: 23 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  small: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  button: { minHeight: 46, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 11, backgroundColor: "#B92D39", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 9, borderWidth: 1, borderColor: "transparent", alignSelf: "flex-start" },
  secondary: { backgroundColor: colors.surfaceTertiary, borderColor: colors.borderStrong },
  buttonText: { color: "white", fontSize: 14, fontWeight: "600", textAlign: "center" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  input: { color: colors.onSurface, fontSize: 16, minHeight: 48, backgroundColor: colors.surface, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 11, padding: 13 },
  message: { color: "#FFD18A", backgroundColor: "#35281B", padding: 15, borderRadius: 10, fontSize: 14, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
});
