import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import FeatherIcon from "@react-native-vector-icons/feather";

import { api, ResultsResponse, ResultSemester } from "@/src/api";
import { Backdrop } from "@/src/components/backdrop";
import { GlassCard } from "@/src/components/ui";
import { storage } from "@/src/storage";
import { colors, radius, spacing } from "@/src/theme";

const GRADE_COLOR: Record<string, string> = {
  O: colors.success,
  "A+": "#4ADE80",
  A: "#86EFAC",
  "B+": colors.info,
  B: "#60A5FA",
  "C+": colors.warning,
  C: "#FBBF24",
  P: colors.warning,
  F: colors.error,
};
const gradeColor = (g: string) => GRADE_COLOR[g] ?? colors.muted;

function SemesterCard({ s, best, index }: { s: ResultSemester; best: number | null; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const sgpa = s.sgpa ?? 0;
  return (
    <View style={styles.semCard} testID={`results-sem-${s.semester}`}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.semHead} testID={`results-sem-toggle-${s.semester}`}>
        <View style={styles.semBadge}>
          <Text style={styles.semBadgeText}>S{s.semester}</Text>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.semTop}>
            <Text style={styles.semTitle}>Semester {s.semester}</Text>
            <Text style={[styles.semVal, s.sgpa === best && { color: colors.brandPrimary }]}>
              {s.sgpa != null ? s.sgpa.toFixed(2) : "--"}
            </Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.min(100, (sgpa / 10) * 100)}%` }]} />
          </View>
          <Text style={styles.semMeta}>
            {s.subjects.length} subjects · {s.credits_secured}/{s.credits_registered} credits
          </Text>
        </View>
        <FeatherIcon name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
      </Pressable>
      {open ? (
        <View style={styles.subjList}>
          {s.subjects.map((sub, i) => (
            <View key={`${sub.subject_code}-${i}`} style={styles.subjRow}>
              <Text style={styles.subjCode}>{sub.subject_code}</Text>
              <Text style={styles.subjCredits}>{sub.credits != null ? `${sub.credits} cr` : ""}</Text>
              <View style={[styles.gradePill, { borderColor: gradeColor(sub.grade) }]}>
                <Text style={[styles.gradeText, { color: gradeColor(sub.grade) }]}>{sub.grade}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [roll, setRoll] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [cached, setCached] = useState<ResultsResponse | null>(null);

  useEffect(() => {
    storage.getRollAndPassword().then((c) => setRoll(c.roll && c.roll !== "guest" ? c.roll.toUpperCase() : ""));
  }, []);

  // Instant paint from device cache while the network request runs.
  useEffect(() => {
    if (!roll) return;
    storage.getResults(roll).then((r) => setCached(r));
  }, [roll]);

  const q = useQuery({
    queryKey: ["results", roll],
    queryFn: async () => {
      const r = await api.results(roll as string);
      if (r.ok) storage.setResults(roll as string, r);
      return r;
    },
    enabled: !!roll,
  });

  const data: ResultsResponse | null = q.data?.ok ? q.data : cached?.ok ? cached : null;
  const showingCache = !!data && !q.data?.ok;
    const sgpas = data?.semester_sgpas ?? [];
  const best = sgpas.length ? Math.max(...sgpas) : null;
  const notFound = !!roll && !q.isLoading && !data && (q.isError || (q.data && !q.data.ok));
  const dist = Object.entries(data?.grade_distribution ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.root} testID="results-root">
      <Backdrop intensity="low" />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="results-back">
          <FeatherIcon name="chevron-left" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>My Results</Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {roll
              ? `${roll} · ${q.isFetching ? "refreshing…" : showingCache ? "offline copy" : "NSUT Results"}`
              : "Semester results"}
          </Text>
        </View>
        {roll ? (
          <Pressable onPress={() => setRoll("")} style={styles.iconBtn} testID="results-change-roll">
            <FeatherIcon name="search" size={18} color={colors.onSurface} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          roll ? <RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} /> : undefined
        }
      >
        {roll === "" ? (
          <GlassCard>
            <View style={styles.pad}>
              <Text style={styles.cardTitle}>Enter a roll number</Text>
              <Text style={styles.cardSub}>CGPA, rank, every semester & subject grade.</Text>
              <TextInput
                testID="results-roll-input"
                value={input}
                onChangeText={setInput}
                placeholder="e.g. 2024UME4136"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
                onSubmitEditing={() => input.trim() && setRoll(input.trim().toUpperCase())}
              />
              <Pressable
                testID="results-lookup-button"
                onPress={() => input.trim() && setRoll(input.trim().toUpperCase())}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Look up results</Text>
              </Pressable>
            </View>
          </GlassCard>
        ) : null}

        {roll && q.isLoading && !data ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.brandPrimary} />
            <Text style={styles.loading}>Fetching your results…</Text>
          </View>
        ) : null}

        {data ? (
          <>
            <GlassCard>
              <View style={[styles.pad, { gap: spacing.lg }]} testID="results-cgpa-card">
                <View style={styles.heroRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.eyebrow}>CGPA</Text>
                    <Text style={styles.cgpa}>{data.cgpa != null ? data.cgpa.toFixed(2) : "--"}</Text>
                    {data.name ? (
                      <Text style={styles.name} numberOfLines={1}>
                        {data.name}
                      </Text>
                    ) : null}
                    <Text style={styles.nameSub}>
                      {[data.branch_code, data.year_of_study ? `Batch ${data.year_of_study}` : null].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  {data.percentile != null ? (
                    <View style={styles.percentile}>
                      <Text style={styles.percentileNum}>{Math.round(data.percentile)}</Text>
                      <Text style={styles.percentileLbl}>percentile</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statNum}>#{data.rank ?? "--"}</Text>
                    <Text style={styles.statLbl}>Batch rank</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statNum}>#{data.branch_rank ?? "--"}</Text>
                    <Text style={styles.statLbl}>Branch rank</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statNum}>{data.credits_completed ?? "--"}</Text>
                    <Text style={styles.statLbl}>Credits</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statNum}>{best != null ? best.toFixed(2) : "--"}</Text>
                    <Text style={styles.statLbl}>Best SGPA</Text>
                  </View>
                </View>
                {showingCache || data.cached ? (
                  <View style={styles.cacheRow}>
                    <FeatherIcon name="clock" size={12} color={colors.muted} />
                    <Text style={styles.cacheText}>
                      {showingCache ? "Showing saved copy — server unreachable" : "Loaded instantly from cache"}
                    </Text>
                  </View>
                ) : null}
              </View>
            </GlassCard>

            {sgpas.length > 1 ? (
              <View style={styles.trendCard} testID="results-trend">
                <Text style={styles.section}>SGPA trend</Text>
                <View style={styles.trend}>
                  {(data.semesters ?? []).map((s) => (
                    <View key={s.semester} style={styles.trendCol}>
                      <Text style={styles.trendVal}>{s.sgpa?.toFixed(1) ?? "-"}</Text>
                      <View style={styles.trendTrack}>
                        <View
                          style={[
                            styles.trendBar,
                            { height: `${Math.max(6, ((s.sgpa ?? 0) / 10) * 100)}%` },
                            s.sgpa === best && { backgroundColor: colors.brandPrimary },
                          ]}
                        />
                      </View>
                      <Text style={styles.trendLbl}>S{s.semester}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {dist.length ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.section}>Grades · {data.total_subjects ?? ""} subjects</Text>
                <View style={styles.distRow}>
                  {dist.map(([g, n]) => (
                    <View key={g} style={[styles.distPill, { borderColor: gradeColor(g) }]}>
                      <Text style={[styles.distGrade, { color: gradeColor(g) }]}>{g}</Text>
                      <Text style={styles.distCount}>×{n}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={{ gap: spacing.sm }}>
              <Text style={styles.section}>Semester-wise</Text>
              {[...(data.semesters ?? [])].reverse().map((s, i) => (
                <SemesterCard key={s.semester} s={s} best={best} index={i} />
              ))}
            </View>
          </>
        ) : null}

        {notFound ? (
          <GlassCard>
            <View style={[styles.pad, { alignItems: "center" }]} testID="results-error-card">
              <View style={styles.errIcon}>
                <FeatherIcon name="alert-circle" size={24} color={colors.warning} />
              </View>
              <Text style={styles.cardTitle}>No results found</Text>
              <Text style={[styles.cardSub, { textAlign: "center" }]}>
                No results found for this roll number yet.
              </Text>
              <Pressable testID="results-try-another" onPress={() => setRoll("")} style={styles.linkBtn}>
                <Text style={styles.linkText}>Try a different roll number</Text>
              </Pressable>
            </View>
          </GlassCard>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
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
  scroll: { padding: spacing.lg, gap: spacing.xl },
  pad: { padding: spacing.xl, gap: spacing.md },
  cardTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "600" },
  cardSub: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  input: {
    backgroundColor: colors.surfaceTertiary,
    color: colors.onSurface,
    paddingHorizontal: spacing.lg,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  cta: {
    height: 50,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  ctaText: { color: colors.onBrandPrimary, fontSize: 15, fontWeight: "500" },
  linkBtn: { padding: spacing.sm },
  linkText: { color: colors.muted, fontSize: 13 },
  center: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxl },
  loading: { color: colors.muted, fontSize: 13 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  eyebrow: { color: colors.muted, fontSize: 11, letterSpacing: 2 },
  cgpa: { color: colors.onSurface, fontSize: 56, fontWeight: "600", letterSpacing: -2, lineHeight: 62 },
  name: { color: colors.onSurface, fontSize: 15, fontWeight: "500" },
  nameSub: { color: colors.muted, fontSize: 12 },
  percentile: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  percentileNum: { color: colors.onBrandTertiary, fontSize: 26, fontWeight: "600" },
  percentileLbl: { color: colors.onBrandTertiary, fontSize: 10, letterSpacing: 0.5 },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stat: { alignItems: "center", gap: 2, flex: 1 },
  statNum: { color: colors.onSurface, fontSize: 16, fontWeight: "600" },
  statLbl: { color: colors.muted, fontSize: 10 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  cacheRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cacheText: { color: colors.muted, fontSize: 11 },
  section: { color: colors.onSurface, fontSize: 16, fontWeight: "600" },
  trendCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  trend: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, height: 140 },
  trendCol: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  trendVal: { color: colors.onSurfaceTertiary, fontSize: 11 },
  trendTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  trendBar: { width: "100%", borderRadius: 6, backgroundColor: colors.surfaceTertiary },
  trendLbl: { color: colors.muted, fontSize: 11 },
  distRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  distPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  distGrade: { fontSize: 13, fontWeight: "600" },
  distCount: { color: colors.muted, fontSize: 12 },
  semCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  semHead: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  semBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  semBadgeText: { color: colors.onBrandTertiary, fontSize: 13, fontWeight: "600" },
  semTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  semTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "500" },
  semVal: { color: colors.onSurface, fontSize: 16, fontWeight: "600" },
  semMeta: { color: colors.muted, fontSize: 11 },
  bar: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.brandPrimary },
  subjList: { borderTopWidth: 1, borderTopColor: colors.divider, paddingHorizontal: spacing.lg },
  subjRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  subjCode: { color: colors.onSurface, fontSize: 13, fontWeight: "500", flex: 1 },
  subjCredits: { color: colors.muted, fontSize: 12 },
  gradePill: {
    minWidth: 40,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: { fontSize: 12, fontWeight: "600" },
  errIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  outlineText: { color: colors.onSurface, fontSize: 14, fontWeight: "500" },
});
