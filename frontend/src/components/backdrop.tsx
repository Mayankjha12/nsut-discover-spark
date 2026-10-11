import { StyleSheet, View } from "react-native";
import { colors } from "../theme";
export function Backdrop(_props: { intensity?: "high" | "low" }) { return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />; }
