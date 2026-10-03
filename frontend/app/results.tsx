import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { WebView } from "react-native-webview";
import FeatherIcon from "@react-native-vector-icons/feather";

import { api } from "@/src/api";
import { GlassCard } from "@/src/components/ui";
import { storage } from "@/src/storage";
import { colors, radius, spacing } from "@/src/theme";

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [roll, setRoll] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showWeb, setShowWeb] = useState(false);

  useEffect(() => {
    storage.getRollAndPassword().then((c) => {
      if (c.roll && c.roll !== "guest") setRoll(c.roll);
      else setRoll("");
    });
  }, []);

  const q = useQuery({
    queryKey: ["results", roll],
    queryFn: () => api.results(roll as string),
    enabled: !!roll,
  });

  const fallbackUrl = q.data?.url || `https://www.resulthubnsut.com/student/${roll}`;
  const sgpas = q.data?.semester_sgpas ?? [];
  const best = sgpas.length ? Math.max(...sgpas) : null;

  return (
    <View style={styles.root} testID="results-root">
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="results-back">
          <FeatherIcon name="chevron-left" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>My Results</Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {roll ? `${roll} · resulthubnsut.com` : "Semester results"}
          </Text>
        </View>
        {roll ? (
          <Pressable onPress={() => q.refetch()} style={styles.iconBtn} testID="results-refresh">
            <FeatherIcon name="rotate-cw" size={18} color={colors.onSurface} />
          </Pressable>
        ) : null}
      </View>

      {showWeb && roll && Platform.OS !== "web" ? (
        <WebView source={{ uri: fallbackUrl }} style={{ flex: 1, backgroundColor: colors.surface }} testID="results-webview" />
      ) : (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
          {roll === "" ? (
            <GlassCard>
              <View style={styles.pad}>
                <Text style={styles.cardTitle}>Enter your roll number</Text>
                <Text style={styles.cardSub}>We’ll look it up on ResultHub NSUT.</Text>
                <TextInput
                  testID="results-roll-input"
                  value={input}
                  onChangeText={setInput}
                  placeholder="e.g. 2023UCS1234"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={styles.input}
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

          {roll && q.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.brandPrimary} />
              <Text style={styles.loading}>Fetching from ResultHub…</Text>
            </View>
          ) : null}

          {roll && q.data?.ok ? (
            <>
              <GlassCard>
                <View style={[styles.pad, { alignItems: "center", gap: spacing.xs }]} testID="results-cgpa-card">
                  <Text style={styles.eyebrow}>CGPA</Text>
                  <Text style={styles.cgpa}>{q.data.cgpa != null ? q.data.cgpa.toFixed(2) : "--"}</Text>
                  {q.data.name ? <Text style={styles.name}>{q.data.name}</Text> : null}
                  <View style={styles.statRow}>
                    <View style={styles.stat}>
                      <Text style={styles.statNum}>{sgpas.length}</Text>
                      <Text style={styles.statLbl}>Semesters</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                      <Text style={styles.statNum}>{best != null ? best.toFixed(2) : "--"}</Text>
                      <Text style={styles.statLbl}>Best SGPA</Text>
                    </View>
                  </View>
                </View>
              </GlassCard>

              {sgpas.length ? (
                <View style={{ gap: spacing.sm }}>
                  <Text style={styles.section}>Semester-wise SGPA</Text>
                  {sgpas.map((s, i) => (
                    <View key={i} style={styles.semRow} testID={`results-sem-${i + 1}`}>
                      <View style={styles.semBadge}>
                        <Text style={styles.semBadgeText}>S{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 6 }}>
                        <View style={styles.semTop}>
                          <Text style={styles.semTitle}>Semester {i + 1}</Text>
                          <Text style={[styles.semVal, s === best && { color: colors.brandPrimary }]}>{s.toFixed(2)}</Text>
                        </View>
                        <View style={styles.bar}>
                          <View style={[styles.barFill, { width: `${Math.min(100, (s / 10) * 100)}%` }]} />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.note}>No semester breakdown parsed. Open ResultHub for the full sheet.</Text>
              )}
            </>
          ) : null}

          {roll && !q.isLoading && (q.isError || (q.data && !q.data.ok)) ? (
            <GlassCard>
              <View style={[styles.pad, { alignItems: "center" }]} testID="results-error-card">
                <View style={styles.errIcon}>
                  <FeatherIcon name="alert-circle" size={24} color={colors.warning} />
                </View>
                <Text style={styles.cardTitle}>Couldn’t parse results</Text>
                <Text style={[styles.cardSub, { textAlign: "center" }]}>
                  {q.data?.error || "ResultHub didn’t return a readable page."} You can still view them directly.
                </Text>
                <Pressable
                  testID="results-open-web"
                  onPress={() => (Platform.OS === "web" ? Linking.openURL(fallbackUrl) : setShowWeb(true))}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>Open on ResultHub</Text>
                </Pressable>
                <Pressable testID="results-change-roll" onPress={() => setRoll("")} style={styles.linkBtn}>
                  <Text style={styles.linkText}>Try a different roll number</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : null}

          {roll && q.data?.ok ? (
            <Pressable
              testID="results-view-source"
              onPress={() => (Platform.OS === "web" ? Linking.openURL(fallbackUrl) : setShowWeb(true))}
              style={styles.outlineBtn}
            >
              <FeatherIcon name="external-link" size={16} color={colors.onSurface} />
              <Text style={styles.outlineText}>View full sheet on ResultHub</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}

      {showWeb ? (
        <Pressable
          testID="results-close-web"
          onPress={() => setShowWeb(false)}
          style={[styles.floating, { bottom: insets.bottom + 16 }]}
        >
          <Text style={styles.ctaText}>Back to summary</Text>
        </Pressable>
      ) : null}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "500" },
  topSub: { color: colors.muted, fontSize: 11 },
  scroll: { padding: spacing.xl, gap: spacing.xl },
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
  eyebrow: { color: colors.muted, fontSize: 11, letterSpacing: 2 },
  cgpa: { color: colors.onSurface, fontSize: 64, fontWeight: "600", letterSpacing: -2, lineHeight: 72 },
  name: { color: colors.onSurfaceTertiary, fontSize: 14 },
  statRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: spacing.xl },
  stat: { alignItems: "center", gap: 2 },
  statNum: { color: colors.onSurface, fontSize: 18, fontWeight: "600" },
  statLbl: { color: colors.muted, fontSize: 11 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  section: { color: colors.onSurface, fontSize: 16, fontWeight: "600", marginBottom: spacing.xs },
  semRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
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
  bar: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.brandPrimary },
  note: { color: colors.muted, fontSize: 13, textAlign: "center" },
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
  floating: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
});
