import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeatherIcon from "@react-native-vector-icons/feather";

import { GlassCard, Pill } from "@/src/components/ui";
import { attendanceColor, bunkInfo } from "@/src/components/progress-ring";
import { storage } from "@/src/storage";
import { Backdrop } from "@/src/components/backdrop";
import { colors, radius, spacing } from "@/src/theme";

type Filter = "all" | "theory" | "practical";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "theory", label: "Theory" },
  { key: "practical", label: "Practical" },
];

type Subject = { name: string; code?: string; percent: number; present?: number | null; total?: number | null; credits?: string | null };

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
  // Bunk planner: planned skips (+) or planned attends (−) per subject code
  const [plan, setPlan] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const [a, c, p] = await Promise.all([storage.getAttendance(), storage.getRollAndPassword(), storage.getBunkPlan()]);
    setData(a);
    setRoll(c.roll);
    setPlan(p ?? {});
    setLoaded(true);
  }, []);

  function adjustPlan(key: string, delta: number) {
    setPlan((prev) => {
      const next = { ...prev, [key]: (prev[key] ?? 0) + delta };
      if (next[key] === 0) delete next[key];
      storage.setBunkPlan(next);
      return next;
    });
  }
  const planActive = Object.keys(plan).length > 0;
  const projected = useMemo(() => {
    const list: Subject[] = data?.subjects ?? [];
    let p = 0,
      t = 0;
    list.forEach((s) => {
      if (s.present == null || s.total == null) return;
      const d = plan[s.code ?? s.name] ?? 0;
      p += s.present + Math.max(0, -d);
      t += s.total + Math.abs(d);
    });
    return t ? { present: p, total: t, pct: (p / t) * 100 } : null;
  }, [data, plan]);

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
    else router.push({ pathname: "/login", params: { resync: "1" } });
  }

  const overall: number | null = data?.overall_percent ?? null;
  const overallBunk = bunkInfo(data?.total_present, data?.total_classes);

  return (
    <View style={styles.root} testID="attendance-root">
      <Backdrop intensity="low" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Attendance</Text>
            <Text style={styles.sub}>
              {overall != null
                ? `Overall ${Math.round(overall)}%${data?.total_classes ? ` · ${data.total_present}/${data.total_classes} classes` : ""}`
                : "Synced from IMS NSUT"}
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
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            {overallBunk ? (
              <View style={[styles.summary, { borderColor: overallBunk.safe ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)" }]} testID="attendance-bunk-summary">
                <FeatherIcon name={overallBunk.safe ? "coffee" : "alert-triangle"} size={18} color={overallBunk.safe ? colors.success : colors.error} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryTitle}>
                    {overallBunk.safe
                      ? `You can skip ${overallBunk.count} more ${overallBunk.count === 1 ? "class" : "classes"}`
                      : `Attend the next ${overallBunk.count} ${overallBunk.count === 1 ? "class" : "classes"}`}
                  </Text>
                  <Text style={styles.summarySub}>
                    {overallBunk.safe ? "and still stay at or above 75% overall." : "in a row to climb back to 75% overall."}
                  </Text>
                </View>
              </View>
            ) : null}
            {planActive && projected ? (
              <View style={[styles.summary, { borderColor: colors.borderStrong }]} testID="attendance-plan-summary">
                <FeatherIcon name="calendar" size={18} color={colors.info} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryTitle}>
                    Planned: overall → {projected.pct.toFixed(1)}%{" "}
                    <Text style={{ color: attendanceColor(projected.pct) }}>
                      ({projected.pct >= 75 ? "safe" : "below 75%"})
                    </Text>
                  </Text>
                  <Text style={styles.summarySub}>
                    {projected.present}/{projected.total} classes after your planned bunks & attends
                  </Text>
                </View>
                <Pressable
                  testID="attendance-plan-reset"
                  onPress={() => {
                    setPlan({});
                    storage.setBunkPlan({});
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.resetText}>Reset</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
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
          const key = item.code ?? item.name;
          const d = plan[key] ?? 0;
          const hasCounts = item.present != null && item.total != null && item.total > 0;
          const projPresent = hasCounts ? item.present! + Math.max(0, -d) : null;
          const projTotal = hasCounts ? item.total! + Math.abs(d) : null;
          const projPct = projPresent != null && projTotal ? (projPresent / projTotal) * 100 : item.percent;
          const c = attendanceColor(projPct);
          const b = bunkInfo(projPresent, projTotal);
          return (
            <View style={styles.card} testID={`attendance-subject-${index}`}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.subjName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.code && item.code !== item.name ? <Text style={styles.subjCode}>{item.code}</Text> : null}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.pct, { color: c }]}>{Math.round(projPct)}%</Text>
                  {hasCounts ? (
                    <Text style={styles.count}>
                      {d !== 0 ? `${projPresent}/${projTotal} · was ${Math.round(item.percent)}%` : `${item.present}/${item.total}`}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, projPct))}%`, backgroundColor: c }]} />
                <View style={styles.threshold} />
              </View>
              {b ? (
                <View style={styles.bunkRow}>
                  <View style={[styles.bunkPill, { backgroundColor: b.safe ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }]}>
                    <FeatherIcon name={b.safe ? "coffee" : "zap"} size={12} color={b.safe ? colors.success : colors.error} />
                    <Text style={[styles.bunkText, { color: b.safe ? colors.success : colors.error }]}>
                      {b.safe ? `Can skip ${b.count}` : `Attend next ${b.count}`}
                    </Text>
                  </View>
                  <Text style={[styles.hint, { flex: 1 }]}>{b.safe ? "and stay ≥ 75%" : "to reach 75%"}</Text>
                  <View style={styles.planner}>
                    <Pressable testID={`plan-attend-${index}`} onPress={() => adjustPlan(key, -1)} style={styles.planBtn} hitSlop={6}>
                      <FeatherIcon name="check" size={14} color={colors.success} />
                    </Pressable>
                    <Text style={[styles.planVal, d > 0 && { color: colors.error }, d < 0 && { color: colors.success }]}>
                      {d > 0 ? `${d} bunk` : d < 0 ? `${-d} go` : "plan"}
                    </Text>
                    <Pressable testID={`plan-bunk-${index}`} onPress={() => adjustPlan(key, 1)} style={styles.planBtn} hitSlop={6}>
                      <FeatherIcon name="x" size={14} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Text style={styles.hint}>
                  {item.percent >= 75
                    ? "Safe — above 75% threshold"
                    : item.percent >= 65
                      ? "Borderline — attend next classes"
                      : "Below threshold — attend all classes"}
                </Text>
              )}
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
    backgroundColor: 'transparent',
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
  count: { color: colors.muted, fontSize: 11 },
  bar: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: radius.pill },
  threshold: { position: "absolute", left: "75%", top: 0, bottom: 0, width: 2, backgroundColor: colors.onSurface, opacity: 0.5 },
  bunkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bunkPill: { flexDirection: "row", alignItems: "center", gap: 6, height: 26, paddingHorizontal: 10, borderRadius: radius.pill },
  bunkText: { fontSize: 12, fontWeight: "600" },
  planner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    padding: 3,
  },
  planBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  planVal: { color: colors.muted, fontSize: 11, fontWeight: "600", minWidth: 40, textAlign: "center" },
  resetText: { color: colors.brandPrimary, fontSize: 13, fontWeight: "500" },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  summaryTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "600" },
  summarySub: { color: colors.muted, fontSize: 12, marginTop: 2 },
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
