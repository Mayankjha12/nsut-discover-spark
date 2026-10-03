import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { GlassCard } from "@/src/components/ui";
import { storage } from "@/src/storage";
import { colors, radius, spacing } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1566755828900-5de2b8ac5cbd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9kZXJuJTIwdW5pdmVyc2l0eSUyMGJ1aWxkaW5nJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHxibGFja3wxNzkwOTU0ODY2fDA&ixlib=rb-4.1.0&q=85";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [roll, setRoll] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleContinue() {
    setErr(null);
    const r = roll.trim();
    if (!r || !pw) {
      setErr("Roll number and password required");
      return;
    }
    setLoading(true);
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await storage.setRollAndPassword(r, pw);
      router.replace({ pathname: "/ims-login", params: { roll: r, pw } });
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root} testID="login-root">
      <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={["rgba(15,17,21,0.4)", "rgba(15,17,21,0.9)", colors.surface]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
            <View style={styles.brandWrap} testID="brand-mark">
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>N</Text>
              </View>
              <Text style={styles.wordmark}>NSUT HUB</Text>
              <Text style={styles.tagline}>Attendance • Rooms • Results — all in one.</Text>
            </View>

            <GlassCard style={styles.card}>
              <View style={{ padding: spacing.xl, gap: spacing.lg }}>
                <View>
                  <Text style={styles.cardTitle}>Sign in with IMS</Text>
                  <Text style={styles.cardSub}>Use your imsnsit.org credentials.</Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Roll Number</Text>
                  <TextInput
                    testID="roll-input"
                    value={roll}
                    onChangeText={setRoll}
                    placeholder="e.g. 2023UCS1234"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    testID="password-input"
                    value={pw}
                    onChangeText={setPw}
                    placeholder="IMS password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    style={styles.input}
                  />
                </View>

                {err ? (
                  <Text style={styles.errorText} testID="login-error">
                    {err}
                  </Text>
                ) : null}

                <Pressable
                  testID="continue-button"
                  onPress={handleContinue}
                  disabled={loading}
                  style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onBrandPrimary} />
                  ) : (
                    <Text style={styles.ctaText}>Continue</Text>
                  )}
                </Pressable>

                <Text style={styles.hint}>
                  Captcha will appear in the next step. Your credentials never leave the device
                  except to imsnsit.org.
                </Text>
              </View>
            </GlassCard>

            <Pressable
              testID="skip-button"
              onPress={async () => {
                await storage.setRollAndPassword("guest", "guest");
                router.replace("/(tabs)");
              }}
              style={styles.skip}
            >
              <Text style={styles.skipText}>Skip for now — explore vacant rooms →</Text>
            </Pressable>
          </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  brandWrap: { alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.lg },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: { color: colors.onBrandPrimary, fontSize: 24, fontWeight: "600" },
  wordmark: { color: colors.onSurface, fontSize: 32, letterSpacing: 2, fontWeight: "600" },
  tagline: { color: colors.muted, fontSize: 13 },
  card: {},
  cardTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "500" },
  cardSub: { color: colors.muted, fontSize: 13, marginTop: 4 },
  field: { gap: 6 },
  label: { color: colors.onSurfaceTertiary, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
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
  errorText: { color: colors.error, fontSize: 13 },
  cta: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  ctaText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "500" },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  skip: { alignSelf: "center", padding: spacing.md },
  skipText: { color: colors.muted, fontSize: 13 },
});
