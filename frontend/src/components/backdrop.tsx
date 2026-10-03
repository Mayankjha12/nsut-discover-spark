import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { colors } from "../theme";

type Props = { intensity?: "high" | "low" };

/**
 * Cinematic dark backdrop — soft crimson glow top-left, faint warm accent,
 * cool shadow bottom-right. Pure vector radial gradients: no network, no hard edges.
 */
export function Backdrop({ intensity = "high" }: Props) {
  const { width, height } = useWindowDimensions();
  const k = intensity === "high" ? 1 : 0.55;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="g1" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.brandPrimary} stopOpacity={0.85 * k} />
            <Stop offset="0.45" stopColor={colors.brandSecondary} stopOpacity={0.35 * k} />
            <Stop offset="1" stopColor={colors.surface} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g2" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FF8A80" stopOpacity={0.35 * k} />
            <Stop offset="1" stopColor={colors.surface} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g3" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.info} stopOpacity={0.16 * k} />
            <Stop offset="1" stopColor={colors.surface} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill={colors.surface} />
        <Circle cx={width * 0.15} cy={height * 0.05} r={width * 0.95} fill="url(#g1)" />
        <Circle cx={width * 0.95} cy={height * 0.22} r={width * 0.55} fill="url(#g2)" />
        <Circle cx={width * 0.9} cy={height * 0.95} r={width * 0.8} fill="url(#g3)" />
      </Svg>
    </View>
  );
}
