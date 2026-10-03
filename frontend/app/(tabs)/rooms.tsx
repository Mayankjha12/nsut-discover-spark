import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import FeatherIcon from "@react-native-vector-icons/feather";

import { api } from "@/src/api";
import { Backdrop } from "@/src/components/backdrop";
import { colors, radius, spacing } from "@/src/theme";

const EMPTY_IMG =
  "https://images.unsplash.com/photo-1417816491410-d61e1546e539?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMHJvb20lMjBkYXJrJTIwYWVzdGhldGljfGVufDB8fHxibGFja3wxNzkwOTU0ODU0fDA&ixlib=rb-4.1.0&q=85";

function block(room: string) {
  return room.split("-")[0];
}

export default function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const q = useQuery({ queryKey: ["vacant-rooms"], queryFn: () => api.vacantRooms(), refetchInterval: 60_000 });
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (q.data && selected == null) {
      setSelected(q.data.current_slot ?? q.data.chosen_slot ?? 0);
    }
  }, [q.data, selected]);

  const slot = useMemo(() => q.data?.slots.find((s) => s.index === selected) ?? null, [q.data, selected]);
  const isWeekend = (q.data?.weekday ?? 0) >= 5;

  const grouped = useMemo(() => {
    const rooms = slot?.rooms ?? [];
    const map = new Map<string, string[]>();
    rooms.forEach((r) => {
      const b = block(r);
      map.set(b, [...(map.get(b) ?? []), r]);
    });
    return Array.from(map.entries()).map(([b, rs]) => ({ block: b, rooms: rs }));
  }, [slot]);

  return (
    <View style={styles.root} testID="rooms-root">
      <Backdrop intensity="low" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Vacant Rooms</Text>
            <Text style={styles.sub} testID="rooms-ist-time">
              {q.data ? `${q.data.weekday_name} · ${q.data.ist_time} IST` : "Loading campus timetable…"}
            </Text>
          </View>
          {slot ? (
            <View style={styles.countBadge} testID="rooms-count-badge">
              <Text style={styles.countNum}>{slot.vacant_count}</Text>
              <Text style={styles.countLbl}>/ {slot.total} free</Text>
            </View>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipContent}
        >
          {(q.data?.slots ?? []).map((s) => {
            const sel = s.index === selected;
            return (
              <Pressable
                key={s.index}
                testID={`rooms-slot-${s.index}`}
                onPress={() => setSelected(s.index)}
                style={[styles.chip, sel && styles.chipSel, s.is_current && !sel && styles.chipNow]}
              >
                {s.is_current ? <View style={[styles.nowDot, sel && { backgroundColor: colors.onBrandPrimary }]} /> : null}
                <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                  {s.start}–{s.end}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={grouped}
        keyExtractor={(g) => g.block}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} />
        }
        ListHeaderComponent={
          q.data && isWeekend ? (
            <View style={styles.banner} testID="rooms-weekend-banner">
              <FeatherIcon name="sun" size={16} color={colors.success} />
              <Text style={styles.bannerText}>It’s the weekend — all rooms free, no classes.</Text>
            </View>
          ) : slot?.is_current ? (
            <View style={styles.banner}>
              <View style={styles.liveDot} />
              <Text style={styles.bannerText}>Showing rooms free right now</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          q.isLoading ? null : q.isError ? (
            <View style={styles.empty}>
              <FeatherIcon name="wifi-off" size={28} color={colors.muted} />
              <Text style={styles.emptyTitle}>Couldn’t reach campus server</Text>
              <Pressable testID="rooms-retry" onPress={() => q.refetch()} style={styles.cta}>
                <Text style={styles.ctaText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.empty} testID="rooms-empty">
              <Image source={{ uri: EMPTY_IMG }} style={styles.emptyImg} contentFit="cover" />
              <Text style={styles.emptyTitle}>No vacant rooms</Text>
              <Text style={styles.emptySub}>Every room is occupied in this slot. Try another time.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.group} testID={`rooms-block-${item.block}`}>
            <View style={styles.groupHead}>
              <Text style={styles.groupTitle}>{item.block} Block</Text>
              <Text style={styles.groupCount}>{item.rooms.length} free</Text>
            </View>
            <View style={styles.roomGrid}>
              {item.rooms.map((r) => (
                <View key={r} style={styles.room} testID={`room-${r}`}>
                  <View style={styles.roomDot} />
                  <Text style={styles.roomText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { color: colors.onSurface, fontSize: 28, fontWeight: "600", letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  countBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 36,
    alignSelf: "center",
  },
  countNum: { color: colors.onBrandTertiary, fontSize: 18, fontWeight: "600", lineHeight: 36 },
  countLbl: { color: colors.onBrandTertiary, fontSize: 12 },
  chipRow: { flexGrow: 0, flexShrink: 0, height: 36 },
  chipContent: { gap: spacing.sm, alignItems: "center" },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  chipSel: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipNow: { borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "500" },
  chipTextSel: { color: colors.onBrandPrimary },
  nowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brandPrimary },
  list: { padding: spacing.xl, gap: spacing.lg },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 40,
  },
  bannerText: { color: colors.onSurfaceSecondary, fontSize: 13, flex: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  group: { gap: spacing.sm },
  groupHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  groupTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "600" },
  groupCount: { color: colors.muted, fontSize: 12 },
  roomGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  room: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: "30%",
    flexGrow: 1,
  },
  roomDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  roomText: { color: colors.onSurface, fontSize: 14, fontWeight: "500" },
  empty: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xxl },
  emptyImg: { width: "100%", height: 180, borderRadius: radius.lg, opacity: 0.8 },
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
