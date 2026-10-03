import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeatherIcon from "@react-native-vector-icons/feather";

import { GlassCard, Pill } from "@/src/components/ui";
import { attendanceColor } from "@/src/components/progress-ring";
import { storage } from "@/src/storage";
import { colors, radius, spacing } from "@/src/theme";

type Filter = "all" | "theory" | "practical";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "theory", label: "Theory" },
  { key: "practical", label: "Practical" },
];

type Subject = { name: string; code?: string; percent: number; cells?: string[] };

function isPractical(s: Subject) {
  const t = `${s.name} ${s.code ?? ""}`.toLowerCase();
  return /lab|practical|workshop|\bp\b/.test(t) || /\d{3}[pP]$/.test(s.code ?? "");
}

export default function AttendanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");
  const [data, setData] = useState<any | null>(null);
  const [roll, setRoll] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [a, c] = await Promise.all([storage.getAttendance(), storage.getRollAndPassword()]);
    setData(a);
    setRoll(c.roll);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const subjects: Subject[] = useMemo(() => {
    const list: Subject[] = data?.subjects ?? [];
    if (filter === "all") return list;
    return list.filter((s) => (filter === "practical" ? isPractical(s) : !isPractical(s)));
  }, [data, filter]);

  const isGuest = !roll || roll === "guest";

  function goSync() {
    if (isGuest) router.push("/login");
    else router.push({ pathname: "/ims-login", params: { roll: roll ?? "" } });
  }

  const overall: number | null = data?.overall_percent ?? null;

  return (
    <View style={styles.root} testID="attendance-root">
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Attendance</Text>
            <Text style={styles.sub}>
              {overall != null ? `Overall ${Math.round(overall)}% · ${data?.subjects?.length ?? 0} subjects` : "Synced from IMS NSUT"}
            </Text>
          </View>
          <Pressable testID="attendance-sync-button" onPress={goSync} style={styles.iconBtn}>
            <FeatherIcon name="refresh-cw" size={18} color={colors.onSurface} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipContent}
        >
          {FILTERS.map((f) => (
            <Pill
              key={f.key}
              label={f.label}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
              testID={`attendance-filter-${f.key}`}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(s, i) => `${s.code ?? s.name}-${i}`}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={goSync} tintColor={colors.brandPrimary} />}
        ListEmptyComponent={
          loaded ? (
            <GlassCard style={styles.emptyCard}>
              <View style={styles.emptyInner}>
                <View style={styles.emptyIcon}>
                  <FeatherIcon name="activity" size={26} color={colors.brandPrimary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {data ? "No subjects in this filter" : "No attendance data yet"}
                </Text>
                <Text style={styles.emptySub}>
                  {data
                    ? "Try another filter."
                    : isGuest
                      ? "Sign in with your IMS roll number to pull live attendance."
                      : "Open the IMS portal, log in once, and we’ll capture your attendance table."}
                </Text>
                {!data ? (
                  <Pressable testID="attendance-empty-sync" onPress={goSync} style={styles.cta}>
                    <Text style={styles.ctaText}>{isGuest ? "Sign in with IMS" : "Sync from IMS"}</Text>
                  </Pressable>
                ) : null}
              </View>
            </GlassCard>
          ) : null
        }
        renderItem={({ item, index }) => {
          const c = attendanceColor(item.percent);
          return (
            <View style={styles.card} testID={`attendance-subject-${index}`}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.subjName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.code ? <Text style={styles.subjCode}>{item.code}</Text> : null}
                </View>
                <Text style={[styles.pct, { color: c }]}>{Math.round(item.percent)}%</Text>
              </View>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, item.percent))}%`, backgroundColor: c }]} />
              </View>
              <Text style={styles.hint}>
                {item.percent >= 75
                  ? "Safe — above 75% threshold"
                  : item.percent >= 65
                    ? "Borderline — attend next classes"
                    : "Below threshold — attend all classes"}
              </Text>
            </View>
          );
        }}
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { color: colors.onSurface, fontSize: 28, fontWeight: "600", letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
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
  chipRow: { flexGrow: 0, flexShrink: 0, height: 36 },
  chipContent: { gap: spacing.sm, alignItems: "center" },
  list: { padding: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  subjName: { color: colors.onSurface, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  subjCode: { color: colors.muted, fontSize: 12, letterSpacing: 0.5 },
  pct: { fontSize: 22, fontWeight: "600", letterSpacing: -0.5 },
  bar: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: radius.pill },
  hint: { color: colors.muted, fontSize: 12 },
  emptyCard: { marginTop: spacing.xl },
  emptyInner: { padding: spacing.xl, alignItems: "center", gap: spacing.md },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "600", textAlign: "center" },
  emptySub: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  cta: {
    marginTop: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: colors.onBrandPrimary, fontWeight: "500", fontSize: 15 },
});
