import { Platform, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { ReactNode } from "react";
import { colors, radius } from "../theme";

type GlassCardProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  radiusToken?: number;
  tint?: "dark" | "light";
};

export function GlassCard({ children, style, intensity = 40, radiusToken = radius.lg, tint = "dark" }: GlassCardProps) {
  if (Platform.OS === "web") {
    return (
      <View
        style={[
          { borderRadius: radiusToken, backgroundColor: "rgba(26,29,36,0.78)", borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
          style as any,
        ]}
      >
        {children}
      </View>
    );
  }
  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[
        { borderRadius: radiusToken, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(26,29,36,0.55)" },
        style as any,
      ]}
    >
      {children}
    </BlurView>
  );
}

type PillProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  testID?: string;
};

export function Pill({ label, selected, onPress, testID }: PillProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        pillStyles.base,
        selected ? pillStyles.selected : pillStyles.unselected,
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* text handled by caller to keep component simple */}
      <View style={{ height: 36, justifyContent: "center" }}>
        <PillText label={label} selected={!!selected} />
      </View>
    </Pressable>
  );
}

import { Text } from "react-native";
function PillText({ label, selected }: { label: string; selected: boolean }) {
  return (
    <Text style={{ color: selected ? colors.onBrandPrimary : colors.onSurfaceSecondary, fontSize: 13, fontWeight: "500" }}>
      {label}
    </Text>
  );
}

const pillStyles = StyleSheet.create({
  base: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
  },
  selected: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  unselected: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
});

export function SectionTitle({ title, subtitle, testID }: { title: string; subtitle?: string; testID?: string }) {
  return (
    <View testID={testID} style={{ gap: 2, marginBottom: 12 }}>
      <Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: "600" }}>{title}</Text>
      {subtitle ? <Text style={{ color: colors.muted, fontSize: 13 }}>{subtitle}</Text> : null}
    </View>
  );
}
