import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import FeatherIcon from "@react-native-vector-icons/feather";

import { api, NoticeItem } from "@/src/api";
import { Backdrop } from "@/src/components/backdrop";
import { colors, radius, spacing } from "@/src/theme";
import { directUrl } from "@/src/utils/links";

function iconFor(n: NoticeItem): React.ComponentProps<typeof FeatherIcon>["name"] {
  const t = n.title.toLowerCase();
  if (/admission|spot round|counsel|reporting/.test(t)) return "user-plus";
  if (/exam|datesheet|result|semester/.test(t)) return "edit-3";
  if (/intern|placement|job|recruit|advertis|post of/.test(t)) return "briefcase";
  if (/conference|workshop|seminar|course|fdp/.test(t)) return "mic";
  if (/fee|payment|scholarship/.test(t)) return "credit-card";
  if (/hostel|mess/.test(t)) return "home";
  return "file-text";
}

export default function NewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const q = useQuery({ queryKey: ["notices"], queryFn: () => api.notices(), staleTime: 5 * 60_000 });
  const items = q.data?.items ?? [];

  return (
    <View style={styles.root} testID="news-root">
      <Backdrop intensity="low" />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="news-back">
          <FeatherIcon name="chevron-left" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Trending @ NSUT</Text>
          <Text style={styles.topSub}>
            {q.isLoading ? "Fetching notices…" : `${items.length} live notices · nsut.ac.in`}
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(n, i) => `${i}-${n.url}`}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} />}
        ListHeaderComponent={
          items.length ? (
            <View style={styles.hero} testID="news-hero">
              <View style={styles.badge}>
                <View style={styles.liveDot} />
                <Text style={styles.badgeText}>LIVE FROM CAMPUS</Text>
              </View>
              <Text style={styles.display}>What’s new{"\n"}on campus.</Text>
              <Text style={styles.heroSub}>Official notices, admissions, drives & events — pulled straight from NSUT.</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          q.isLoading ? null : (
            <View style={styles.empty}>
              <FeatherIcon name="wifi-off" size={28} color={colors.muted} />
              <Text style={styles.emptyTitle}>Couldn’t load notices</Text>
              <Text style={styles.emptySub}>{q.data?.error || "NSUT website didn’t respond."}</Text>
              <Pressable testID="news-retry" onPress={() => q.refetch()} style={styles.cta}>
                <Text style={styles.ctaText}>Retry</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Pressable
            testID={`notice-${index}`}
            onPress={() => Linking.openURL(directUrl(item.url))}
            style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surfaceTertiary }]}
          >
            <View style={styles.cardIcon}>
              <FeatherIcon name={iconFor(item)} size={18} color={colors.brandPrimary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.metaRow}>
                {item.is_new ? (
                  <View style={styles.newPill}>
                    <Text style={styles.newText}>NEW</Text>
                  </View>
                ) : null}
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                </Text>
              </View>
            </View>
            <FeatherIcon name="arrow-up-right" size={16} color={colors.muted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  topBar: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "600" },
  topSub: { color: colors.muted, fontSize: 11 },
  list: { padding: spacing.lg, gap: spacing.sm },
  hero: { paddingVertical: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brandPrimary },
  badgeText: { color: colors.onBrandTertiary, fontSize: 10, fontWeight: "600", letterSpacing: 1.5 },
  display: { color: colors.onSurface, fontSize: 36, fontWeight: "600", letterSpacing: -1.5, lineHeight: 40 },
  heroSub: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "500", lineHeight: 19 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  newPill: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: 6, height: 16, justifyContent: "center" },
  newText: { color: colors.onBrandPrimary, fontSize: 9, fontWeight: "600", letterSpacing: 0.5 },
  cardMeta: { color: colors.muted, fontSize: 11, flex: 1 },
  empty: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xxxl },
  emptyTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "600" },
  emptySub: { color: colors.muted, fontSize: 13, textAlign: "center" },
  cta: {
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: colors.onBrandPrimary, fontWeight: "500" },
});
