import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import FeatherIcon from "@react-native-vector-icons/feather";

import { api } from "@/src/api";
import { GlassCard } from "@/src/components/ui";
import { ProgressRing, attendanceColor } from "@/src/components/progress-ring";
import { storage } from "@/src/storage";
import { colors, radius, spacing } from "@/src/theme";

const HERO_BG =
  "https://images.unsplash.com/photo-1645258163134-1a8e5f1fda55?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxkYXJrJTIwYWJzdHJhY3QlMjAzZCUyMGdsYXNzJTIwc2hhcGV8ZW58MHx8fHJlZHwxNzkwOTU0ODU0fDA&ixlib=rb-4.1.0&q=85";

type Action = {
  key: string;
  title: string;
  sub: string;
  icon: React.ComponentProps<typeof FeatherIcon>["name"];
  route: string;
  accent?: boolean;
};

const ACTIONS: Action[] = [
  { key: "rooms", title: "Vacant Rooms", sub: "Free right now", icon: "map-pin", route: "/(tabs)/rooms", accent: true },
  { key: "attendance", title: "Attendance", sub: "Subject-wise", icon: "activity", route: "/(tabs)/attendance" },
  { key: "results", title: "My Results", sub: "CGPA & SGPA", icon: "award", route: "/results" },
  { key: "news", title: "Trending", sub: "Coming soon", icon: "trending-up", route: "/news" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any | null>(null);
  const [roll, setRoll] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [p, a, creds] = await Promise.all([
          storage.getProfile(),
          storage.getAttendance(),
          storage.getRollAndPassword(),
        ]);
        if (!alive) return;
        setProfile(p);
        setAttendance(a);
        setRoll(creds.roll);
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const rooms = useQuery({ queryKey: ["vacant-rooms"], queryFn: () => api.vacantRooms() });
  const currentSlot = rooms.data?.slots.find((s) => s.is_current) ?? null;
  const freeNow = currentSlot?.vacant_count ?? rooms.data?.slots[0]?.vacant_count ?? null;

  const pct: number | null = attendance?.overall_percent ?? null;
  const isGuest = !roll || roll === "guest";
  const firstName = profile?.name ? String(profile.name).split(" ")[0] : isGuest ? "Explorer" : roll;

  return (
    <View style={styles.root} testID="home-root">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={{ uri: HERO_BG }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          <LinearGradient
            colors={["rgba(15,17,21,0.15)", "rgba(15,17,21,0.75)", colors.surface]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroContent, { paddingTop: insets.top + spacing.lg }]}>
            <View style={styles.heroHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greet}>{greeting()},</Text>
                <Text style={styles.name} numberOfLines={1} testID="home-name">
                  {firstName}
                </Text>
              </View>
              <Pressable
                testID="home-profile-button"
                onPress={() => router.push("/(tabs)/more")}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{String(firstName || "N").charAt(0).toUpperCase()}</Text>
              </Pressable>
            </View>

            <GlassCard style={styles.attCard}>
              <Pressable
                testID="home-attendance-card"
                onPress={() => router.push("/(tabs)/attendance")}
                style={styles.attInner}
              >
                <ProgressRing percent={pct} size={128} stroke={11} color={attendanceColor(pct)} label="overall" />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Text style={styles.attEyebrow}>ATTENDANCE</Text>
                  {pct != null ? (
                    <>
                      <Text style={styles.attTitle}>
                        {pct >= 75 ? "You're safe" : pct >= 65 ? "Borderline" : "Danger zone"}
                      </Text>
                      <Text style={styles.attSub}>
                        {attendance?.subjects?.length ?? 0} subjects tracked · tap for details
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.attTitle}>Not synced yet</Text>
                      <Text style={styles.attSub}>
                        {isGuest ? "Sign in with IMS to track attendance." : "Open IMS to sync your attendance."}
                      </Text>
                      <Pressable
                        testID="home-sync-button"
                        onPress={() =>
                          isGuest
                            ? router.push("/login")
                            : router.push({ pathname: "/ims-login", params: { roll: roll ?? "" } })
                        }
                        style={styles.syncBtn}
                      >
                        <FeatherIcon name="refresh-cw" size={13} color={colors.onBrandPrimary} />
                        <Text style={styles.syncBtnText}>{isGuest ? "Sign in" : "Sync IMS"}</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </Pressable>
            </GlassCard>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.liveRow} testID="home-live-strip">
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>
              {rooms.isLoading
                ? "Checking campus…"
                : rooms.data
                  ? currentSlot
                    ? `${freeNow} rooms free now · ${currentSlot.start}–${currentSlot.end} IST`
                    : rooms.data.weekday >= 5
                      ? "Weekend — all rooms free"
                      : "Outside class hours — all rooms free"
                  : "Campus status unavailable"}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.grid}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.key}
                testID={`home-action-${a.key}`}
                onPress={() => router.push(a.route as any)}
                style={({ pressed }) => [
                  styles.tile,
                  a.accent && styles.tileAccent,
                  pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
                ]}
              >
                <View style={[styles.tileIcon, a.accent && styles.tileIconAccent]}>
                  <FeatherIcon name={a.icon} size={20} color={a.accent ? colors.onBrandPrimary : colors.brandPrimary} />
                </View>
                <View style={{ gap: 2 }}>
                  <Text style={[styles.tileTitle, a.accent && { color: colors.onBrandPrimary }]}>{a.title}</Text>
                  <Text style={[styles.tileSub, a.accent && { color: "rgba(255,255,255,0.75)" }]}>
                    {a.key === "rooms" && freeNow != null ? `${freeNow} free now` : a.sub}
                  </Text>
                </View>
                <FeatherIcon
                  name="arrow-up-right"
                  size={16}
                  color={a.accent ? "rgba(255,255,255,0.8)" : colors.muted}
                  style={styles.tileArrow}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: { minHeight: 380, overflow: "hidden" },
  heroContent: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingBottom: spacing.lg },
  heroHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  greet: { color: colors.onSurfaceTertiary, fontSize: 14 },
  name: { color: colors.onSurface, fontSize: 30, fontWeight: "600", letterSpacing: -0.5 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.onBrandPrimary, fontSize: 18, fontWeight: "600" },
  attCard: {},
  attInner: { flexDirection: "row", alignItems: "center", gap: spacing.lg, padding: spacing.lg },
  attEyebrow: { color: colors.muted, fontSize: 11, letterSpacing: 1.5 },
  attTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "600" },
  attSub: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  syncBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
  },
  syncBtnText: { color: colors.onBrandPrimary, fontSize: 13, fontWeight: "500" },
  body: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingTop: spacing.sm },
  liveRow: {
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
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  liveText: { color: colors.onSurfaceSecondary, fontSize: 13, flex: 1 },
  sectionTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "48%",
    flexGrow: 1,
    minHeight: 136,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: "space-between",
    gap: spacing.md,
  },
  tileAccent: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  tileIconAccent: { backgroundColor: "rgba(255,255,255,0.18)" },
  tileTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "600" },
  tileSub: { color: colors.muted, fontSize: 12 },
  tileArrow: { position: "absolute", top: spacing.lg, right: spacing.lg },
});
