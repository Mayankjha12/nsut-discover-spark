import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors } from "../theme";

type Props = {
  percent: number | null;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
};

export function ProgressRing({ percent, size = 140, stroke = 12, color = colors.brandPrimary, label }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent ?? 0));
  const dash = c * (1 - p / 100);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceTertiary} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dash}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.value, { fontSize: size * 0.24 }]}>
        {percent == null ? "--" : `${Math.round(percent)}%`}
      </Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

export function attendanceColor(p: number | null | undefined) {
  if (p == null) return colors.muted;
  if (p >= 75) return colors.success;
  if (p >= 65) return colors.warning;
  return colors.error;
}

const styles = StyleSheet.create({
  value: { color: colors.onSurface, fontWeight: "600", letterSpacing: -1 },
  label: { color: colors.muted, fontSize: 11, marginTop: 2, textTransform: "uppercase", letterSpacing: 1 },
});
