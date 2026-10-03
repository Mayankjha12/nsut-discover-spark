import { useCallback, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeatherIcon from "@react-native-vector-icons/feather";

import { Backdrop } from "@/src/components/backdrop";
import { GlassCard } from "@/src/components/ui";
import { storage } from "@/src/storage";
import { colors, radius, spacing } from "@/src/theme";

type IconName = React.ComponentProps<typeof FeatherIcon>["name"];

const QUICK_LINKS: { key: string; title: string; url: string; icon: IconName }[] = [
  { key: "ims", title: "IMS Portal", url: "https://www.imsnsit.org/imsnsit/", icon: "globe" },
  { key: "nsut", title: "nsut.ac.in", url: "https://nsut.ac.in/en/home", icon: "home" },
  { key: "fees", title: "Fee Payment", url: "https://www.onlinesbi.com/sbicollect/icollecthome.htm?corpID=649953", icon: "credit-card" },
  { key: "library", title: "Library", url: "https://nsut.ac.in/en/library", icon: "book-open" },
  { key: "maps", title: "Campus Map", url: "https://maps.google.com/?q=Netaji+Subhas+University+of+Technology+Dwarka", icon: "map" },
];

type Row = {
  key: string;
  title: string;
  sub: string;
  icon: IconName;
  onPress: () => void;
  danger?: boolean;
};

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any | null>(null);
  const [roll, setRoll] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [p, c] = await Promise.all([storage.getProfile(), storage.getRollAndPassword()]);
        setProfile(p);
        setRoll(c.roll);
      })();
    }, []),
  );

  const isGuest = !roll || roll === "guest";

  async function logout() {
    await storage.clear();
    router.replace("/login");
  }

  function confirmLogout() {
    if (Platform.OS === "web") {
      logout();
      return;
    }
    Alert.alert("Log out?", "Your saved IMS credentials and cached attendance will be removed from this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  }

  const rows: Row[] = [
    {
      key: "results",
      title: "My Results",
      sub: "CGPA, SGPA & subject grades",
      icon: "award",
      onPress: () => router.push("/results"),
    },
    {
      key: "news",
      title: "Trending",
      sub: "Live campus notices from nsut.ac.in",
      icon: "trending-up",
      onPress: () => router.push("/news"),
    },
    {
      key: "resync",
      title: isGuest ? "Sign in with IMS" : "Resync IMS",
      sub: isGuest ? "Track your attendance" : "Refresh profile & attendance",
      icon: "refresh-cw",
      onPress: () => (isGuest ? router.push("/login") : router.push({ pathname: "/login", params: { resync: "1" } })),
    },
    {
      key: "logout",
      title: isGuest ? "Exit guest mode" : "Log out",
      sub: "Clear saved credentials on this device",
      icon: "log-out",
      onPress: confirmLogout,
      danger: true,
    },
  ];

  const name = profile?.name || (isGuest ? "Guest" : roll);
  const meta = [profile?.branch, profile?.year ? `Year ${profile.year}` : null, profile?.section ? `Sec ${profile.section}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.root} testID="more-root">
      <Backdrop intensity="low" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>More</Text>

        <GlassCard>
          <View style={styles.profile} testID="more-profile-card">
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{String(name || "N").charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.pName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.pRoll} numberOfLines={1}>
                {isGuest ? "Not signed in" : roll}
              </Text>
              {meta ? (
                <Text style={styles.pMeta} numberOfLines={1}>
                  {meta}
                </Text>
              ) : null}
            </View>
            <View style={[styles.statusPill, { backgroundColor: isGuest ? colors.surfaceTertiary : colors.brandTertiary }]}>
              <Text style={[styles.statusText, { color: isGuest ? colors.muted : colors.onBrandTertiary }]}>
                {isGuest ? "GUEST" : "IMS"}
              </Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.rows}>
          {rows.map((r, i) => (
            <Pressable
              key={r.key}
              testID={`more-row-${r.key}`}
              onPress={r.onPress}
              style={({ pressed }) => [
                styles.row,
                i === 0 && styles.rowFirst,
                i === rows.length - 1 && styles.rowLast,
                pressed && { backgroundColor: colors.surfaceTertiary },
              ]}
            >
              <View style={[styles.rowIcon, r.danger && { backgroundColor: "rgba(239,68,68,0.12)" }]}>
                <FeatherIcon name={r.icon} size={18} color={r.danger ? colors.error : colors.brandPrimary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.rowTitle, r.danger && { color: colors.error }]}>{r.title}</Text>
                <Text style={styles.rowSub}>{r.sub}</Text>
              </View>
              <FeatherIcon name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <View style={{ gap: spacing.sm }} testID="more-quick-links">
          <Text style={styles.sectionTitle}>Campus links</Text>
          <View style={styles.linkGrid}>
            {QUICK_LINKS.map((l) => (
              <Pressable
                key={l.key}
                testID={`more-link-${l.key}`}
                onPress={() => Linking.openURL(l.url)}
                style={({ pressed }) => [styles.linkTile, pressed && { backgroundColor: colors.surfaceTertiary }]}
              >
                <FeatherIcon name={l.icon} size={18} color={colors.brandPrimary} />
                <Text style={styles.linkTitle}>{l.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>NSUT Hub · Built for NSUT Delhi students</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  title: { color: colors.onSurface, fontSize: 28, fontWeight: "600", letterSpacing: -0.5 },
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.lg, padding: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.onBrandPrimary, fontSize: 22, fontWeight: "600" },
  pName: { color: colors.onSurface, fontSize: 17, fontWeight: "600" },
  pRoll: { color: colors.muted, fontSize: 13 },
  pMeta: { color: colors.onSurfaceTertiary, fontSize: 12 },
  statusPill: { height: 26, paddingHorizontal: 10, borderRadius: radius.pill, justifyContent: "center" },
  statusText: { fontSize: 10, fontWeight: "600", letterSpacing: 1 },
  rows: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowFirst: {},
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "500" },
  rowSub: { color: colors.muted, fontSize: 12 },
  footer: { color: colors.muted, fontSize: 11, textAlign: "center" },
  sectionTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "600" },
  linkGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  linkTile: {
    width: "31%",
    flexGrow: 1,
    minHeight: 76,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: spacing.sm,
  },
  linkTitle: { color: colors.onSurfaceSecondary, fontSize: 12, fontWeight: "500", textAlign: "center" },
});
