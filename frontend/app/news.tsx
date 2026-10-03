import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeatherIcon from "@react-native-vector-icons/feather";

import { GlassCard } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";

const HERO_BG =
  "https://images.unsplash.com/photo-1645258163134-1a8e5f1fda55?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxkYXJrJTIwYWJzdHJhY3QlMjAzZCUyMGdsYXNzJTIwc2hhcGV8ZW58MHx8fHJlZHwxNzkwOTU0ODU0fDA&ixlib=rb-4.1.0&q=85";

const UPCOMING = ["Campus events & fests", "Society announcements", "Placement & internship drives", "Exam datesheets"];

export default function NewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root} testID="news-root">
      <Image source={{ uri: HERO_BG }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <LinearGradient
        colors={["rgba(15,17,21,0.35)", "rgba(15,17,21,0.85)", colors.surface]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="news-back">
          <FeatherIcon name="chevron-left" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
        <View style={styles.badge}>
          <FeatherIcon name="trending-up" size={14} color={colors.onBrandTertiary} />
          <Text style={styles.badgeText}>TRENDING</Text>
        </View>
        <Text style={styles.display}>Trending{"\n"}Soon.</Text>
        <Text style={styles.sub}>
          Campus news, events and what everyone’s talking about — curated for NSUT, landing in the next update.
        </Text>

        <GlassCard style={{ marginTop: spacing.lg }}>
          <View style={styles.list}>
            {UPCOMING.map((u) => (
              <View key={u} style={styles.item}>
                <View style={styles.dot} />
                <Text style={styles.itemText}>{u}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <Pressable testID="news-back-home" onPress={() => router.replace("/(tabs)")} style={styles.cta}>
          <Text style={styles.ctaText}>Back to Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  topBar: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(26,29,36,0.7)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, justifyContent: "flex-end", paddingHorizontal: spacing.xl, gap: spacing.md },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
  },
  badgeText: { color: colors.onBrandTertiary, fontSize: 10, fontWeight: "600", letterSpacing: 1.5 },
  display: { color: colors.onSurface, fontSize: 52, fontWeight: "600", letterSpacing: -2, lineHeight: 56 },
  sub: { color: colors.onSurfaceTertiary, fontSize: 15, lineHeight: 22, maxWidth: 340 },
  list: { padding: spacing.lg, gap: spacing.md },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brandPrimary },
  itemText: { color: colors.onSurfaceSecondary, fontSize: 14 },
  cta: {
    marginTop: spacing.sm,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: colors.onBrandPrimary, fontSize: 15, fontWeight: "500" },
});
