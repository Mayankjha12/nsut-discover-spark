import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#0F1115",
  onSurface: "#F3F4F6",
  surfaceSecondary: "#1A1D24",
  onSurfaceSecondary: "#E5E7EB",
  surfaceTertiary: "#252932",
  onSurfaceTertiary: "#D1D5DB",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#0F1115",
  muted: "#9CA3AF",

  brand: "#D32F2F",
  onBrand: "#FFFFFF",
  brandPrimary: "#E53935",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#B71C1C",
  onBrandSecondary: "#F3F4F6",
  brandTertiary: "#4A1A1A",
  onBrandTertiary: "#FCA5A5",

  success: "#22C55E",
  onSuccess: "#DCFCE7",
  warning: "#F59E0B",
  onWarning: "#FEF08A",
  error: "#EF4444",
  onError: "#FEE2E2",
  info: "#3B82F6",
  onInfo: "#DBEAFE",

  border: "#2A2D35",
  borderStrong: "#3F4451",
  divider: "#252932",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;
export const themes: { light?: ThemeColors; dark: ThemeColors } = { dark };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const fonts = {
  display: "Outfit",
  text: "Geist",
};

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.light ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "light" && themes.light ? "light" : "dark";
  return { scheme, colors: themes[scheme] ?? themes.dark };
}

export const colors = themes.dark;

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
