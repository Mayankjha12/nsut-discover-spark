import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import * as Haptics from "expo-haptics";
import FeatherIcon from "@react-native-vector-icons/feather";

import { api } from "@/src/api";
import { Backdrop } from "@/src/components/backdrop";
import { GlassCard } from "@/src/components/ui";
import { DETECT_LOGIN_JS, FULL_SYNC_JS } from "@/src/ims-scraper";
import { storage } from "@/src/storage";
import { colors, radius, spacing } from "@/src/theme";

const IMS_HOME = "https://www.imsnsit.org/imsnsit/student.htm";

function autofillJS(roll: string, pw: string) {
  const r = roll.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const p = pw.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `
  (function () {
    try {
      var inputs = document.querySelectorAll('input');
      inputs.forEach(function (i) {
        var name = (i.name || '').toLowerCase();
        var type = (i.type || '').toLowerCase();
        if (name === 'uid' || name.indexOf('roll') >= 0 || name === 'user' || name === 'username') i.value = '${r}';
        else if (type === 'password') i.value = '${p}';
      });
      var cap = document.querySelector('input[name=cap], input[name*=captcha i]');
      if (cap && !cap.value) { cap.scrollIntoView({ block: 'center' }); }
    } catch (e) {}
    true;
  })();`;
}

type Phase = "idle" | "syncing" | "error";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resync } = useLocalSearchParams<{ resync?: string }>();
  const webRef = useRef<WebView>(null);

  const [roll, setRoll] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Enter roll & password — captcha below.");
  const [phase, setPhase] = useState<Phase>("idle");
  const [syncMsg, setSyncMsg] = useState("");
  const [syncErr, setSyncErr] = useState("");
  const [capturedAtt, setCapturedAtt] = useState(false);
  const loggedInRef = useRef(false);

  useEffect(() => {
    storage.getRollAndPassword().then((c) => {
      if (c.roll && c.roll !== "guest") setRoll(c.roll);
      if (c.password && c.roll !== "guest") setPw(c.password);
      setReady(true);
    });
  }, []);

  // Push credentials into the IMS form whenever they change (debounced).
  useEffect(() => {
    if (Platform.OS === "web" || !ready) return;
    const t = setTimeout(() => webRef.current?.injectJavaScript(autofillJS(roll.trim(), pw)), 400);
    return () => clearTimeout(t);
  }, [roll, pw, ready]);

  async function startSync() {
    if (roll.trim()) await storage.setRollAndPassword(roll.trim(), pw);
    setPhase("syncing");
    setSyncErr("");
    setSyncMsg("Logged in. Syncing your data…");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    webRef.current?.injectJavaScript(FULL_SYNC_JS);
  }

  function onMessage(ev: WebViewMessageEvent) {
    let data: any;
    try {
      data = JSON.parse(ev.nativeEvent.data);
    } catch {
      return;
    }
    switch (data.type) {
      case "URL_CHANGED":
        if (data.loginError) setStatus(data.loginError);
        if (data.hasActivities && !loggedInRef.current) {
          loggedInRef.current = true;
          startSync();
        }
        break;
      case "SYNC_PROGRESS":
        setSyncMsg(String(data.message || ""));
        break;
      case "PROFILE_RESULT": {
        const profile = {
          roll_number: data.roll_number || roll.trim(),
          name: data.name || "",
          branch: data.branch || "",
          year: data.year || "",
          section: data.section || "",
          photo: data.photo || "",
        };
        storage.setProfile(profile);
        api.saveProfile(profile).catch(() => {});
        break;
      }
      case "ATTENDANCE_RESULT": {
        const subjects = Array.isArray(data.subjects) ? data.subjects : [];
        storage.setAttendance(data);
        setCapturedAtt(true);
        api
          .saveAttendance({ roll_number: roll.trim(), overall_percent: data.overall_percent, subjects })
          .catch(() => {});
        setSyncMsg(`Attendance synced — ${subjects.length} subjects. Checking rooms…`);
        // Give room-timetable scrape a few seconds, then go to dashboard regardless.
        setTimeout(() => router.replace("/(tabs)"), 8000);
        break;
      }
      case "ROOMS_RESULT":
        api.saveRoomTimetable({ rooms: data.rooms, roll_number: roll.trim() }).catch(() => {});
        setSyncMsg("Room timetables synced");
        break;
      case "SYNC_DONE":
        router.replace("/(tabs)");
        break;
      case "SYNC_ERROR":
        setPhase("error");
        setSyncErr(String(data.message || "Sync failed"));
        break;
    }
  }

  const isWeb = Platform.OS === "web";

  return (
    <View style={styles.root} testID="login-root">
      <Backdrop intensity={isWeb ? "high" : "low"} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={[styles.top, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>N</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.wordmark}>NSUT HUB</Text>
              <Text style={styles.tagline} numberOfLines={1} testID="login-status">
                {status}
              </Text>
            </View>
            {resync ? (
              <Pressable testID="login-back" onPress={() => router.back()} style={styles.iconBtn}>
                <FeatherIcon name="x" size={18} color={colors.onSurface} />
              </Pressable>
            ) : (
              <Pressable
                testID="skip-button"
                onPress={async () => {
                  await storage.setRollAndPassword("guest", "guest");
                  router.replace("/(tabs)");
                }}
                style={styles.skipBtn}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            )}
          </View>

          <GlassCard>
            <View style={styles.form}>
              <View style={styles.inputWrap}>
                <FeatherIcon name="hash" size={16} color={colors.muted} />
                <TextInput
                  testID="roll-input"
                  value={roll}
                  onChangeText={setRoll}
                  placeholder="Roll number"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputWrap}>
                <FeatherIcon name="lock" size={16} color={colors.muted} />
                <TextInput
                  testID="password-input"
                  value={pw}
                  onChangeText={setPw}
                  placeholder="IMS password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPw}
                  style={styles.input}
                />
                <Pressable testID="toggle-password" onPress={() => setShowPw((s) => !s)} hitSlop={8}>
                  <FeatherIcon name={showPw ? "eye-off" : "eye"} size={16} color={colors.muted} />
                </Pressable>
              </View>
            </View>
          </GlassCard>
        </View>

        {isWeb ? (
          <View style={styles.webFallback}>
            <GlassCard>
              <View style={styles.webInner}>
                <View style={styles.webIcon}>
                  <FeatherIcon name="smartphone" size={26} color={colors.brandPrimary} />
                </View>
                <Text style={styles.webTitle}>IMS login works on your phone</Text>
                <Text style={styles.webSub}>
                  Open NSUT Hub on your phone to sign in with IMS (captcha loads right here). Or explore as a guest.
                </Text>
                <Pressable
                  testID="web-continue-demo"
                  onPress={async () => {
                    await storage.setRollAndPassword(roll.trim() || "guest", pw || "guest");
                    router.replace("/(tabs)");
                  }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>{roll.trim() ? "Continue with this roll" : "Explore as guest"}</Text>
                </Pressable>
              </View>
            </GlassCard>
          </View>
        ) : (
          <View style={styles.webviewWrap}>
            <View style={styles.webviewHead}>
              <View style={styles.liveDot} />
              <Text style={styles.webviewHeadText}>imsnsit.org · solve captcha & tap Login</Text>
              <Pressable testID="ims-reload" onPress={() => webRef.current?.reload()} hitSlop={8}>
                <FeatherIcon name="rotate-cw" size={15} color={colors.muted} />
              </Pressable>
            </View>
            {ready ? (
              <WebView
                ref={webRef}
                source={{ uri: IMS_HOME }}
                onMessage={onMessage}
                sharedCookiesEnabled
                thirdPartyCookiesEnabled
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator color={colors.brandPrimary} />
                    <Text style={styles.loadingText}>Loading IMS…</Text>
                  </View>
                )}
                injectedJavaScript={autofillJS(roll.trim(), pw) + DETECT_LOGIN_JS}
                onLoadEnd={() => {
                  webRef.current?.injectJavaScript(autofillJS(roll.trim(), pw) + DETECT_LOGIN_JS);
                }}
                style={styles.webview}
                testID="ims-webview"
              />
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>

      {phase !== "idle" ? (
        <View style={styles.overlay} testID="sync-overlay">
          <Backdrop intensity="high" />
          <View style={[styles.overlayInner, { paddingBottom: insets.bottom + spacing.xl }]}>
            {phase === "syncing" ? (
              <>
                <ActivityIndicator size="large" color={colors.brandPrimary} />
                <Text style={styles.overlayTitle}>{capturedAtt ? "All set!" : "Syncing with IMS"}</Text>
                <Text style={styles.overlaySub}>{syncMsg}</Text>
              </>
            ) : (
              <>
                <View style={styles.errIcon}>
                  <FeatherIcon name="alert-triangle" size={26} color={colors.warning} />
                </View>
                <Text style={styles.overlayTitle}>Couldn’t auto-sync</Text>
                <Text style={styles.overlaySub}>{syncErr}</Text>
                <Pressable testID="sync-retry" onPress={startSync} style={styles.cta}>
                  <Text style={styles.ctaText}>Retry sync</Text>
                </Pressable>
                <Pressable testID="sync-skip" onPress={() => router.replace("/(tabs)")} style={styles.linkBtn}>
                  <Text style={styles.linkText}>Continue without attendance</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  top: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.md },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: { color: colors.onBrandPrimary, fontSize: 20, fontWeight: "600" },
  wordmark: { color: colors.onSurface, fontSize: 18, letterSpacing: 2, fontWeight: "600" },
  tagline: { color: colors.muted, fontSize: 12 },
  skipBtn: { height: 36, paddingHorizontal: spacing.md, justifyContent: "center" },
  skipText: { color: colors.muted, fontSize: 13 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  form: { padding: spacing.md, gap: spacing.sm },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  input: { flex: 1, color: colors.onSurface, fontSize: 15, height: 46 },
  webviewWrap: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  webviewHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 36,
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  webviewHeadText: { color: colors.muted, fontSize: 11, flex: 1 },
  webview: { flex: 1, backgroundColor: colors.surfaceInverse },
  loadingOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    gap: 12,
  },
  loadingText: { color: colors.muted },
  webFallback: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: "center" },
  webInner: { padding: spacing.xl, alignItems: "center", gap: spacing.md },
  webIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  webTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "600", textAlign: "center" },
  webSub: { color: colors.muted, textAlign: "center", lineHeight: 20, fontSize: 13 },
  cta: {
    marginTop: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  ctaText: { color: colors.onBrandPrimary, fontWeight: "500", fontSize: 15 },
  linkBtn: { padding: spacing.sm },
  linkText: { color: colors.muted, fontSize: 13 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.surface },
  overlayInner: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  overlayTitle: { color: colors.onSurface, fontSize: 24, fontWeight: "600", textAlign: "center" },
  overlaySub: { color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20 },
  errIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});
