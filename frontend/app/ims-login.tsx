import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeatherIcon from "@react-native-vector-icons/feather";

import {
  ATTENDANCE_SCRAPE_JS,
  DETECT_LOGIN_JS,
  PROFILE_SCRAPE_JS,
} from "@/src/ims-scraper";
import { api } from "@/src/api";
import { storage } from "@/src/storage";
import { colors, spacing } from "@/src/theme";

const IMS_HOME = "https://www.imsnsit.org/imsnsit/student.htm";

// JS that auto-fills roll + password when the login page loads.
function autofillJS(roll: string, pw: string) {
  const safeRoll = roll.replace(/'/g, "\\'");
  const safePw = pw.replace(/'/g, "\\'");
  return `
  (function () {
    try {
      function fillOne() {
        var inputs = document.querySelectorAll('input');
        var filled = 0;
        inputs.forEach(function (i) {
          var name = (i.name || '').toLowerCase();
          var type = (i.type || '').toLowerCase();
          if (!i.value && (name === 'uid' || name.indexOf('roll') >= 0 || name === 'user' || name === 'username')) {
            i.value = '${safeRoll}'; filled++;
          } else if (!i.value && type === 'password') {
            i.value = '${safePw}'; filled++;
          }
        });
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTOFILLED', filled: filled, url: location.href }));
        }
      }
      fillOne();
      setTimeout(fillOne, 800);
    } catch (e) {}
    true;
  })();
  `;
}

export default function ImsLoginScreen() {
  const { roll, pw } = useLocalSearchParams<{ roll: string; pw: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [status, setStatus] = useState<string>("Opening IMS portal…");
  const [loggedIn, setLoggedIn] = useState(false);

  function onMessage(ev: WebViewMessageEvent) {
    try {
      const data = JSON.parse(ev.nativeEvent.data);
      if (data.type === "URL_CHANGED") {
        const inner = String(data.url || "");
        if (inner.indexOf("student_login.php") < 0 && data.hasLogout) {
          setLoggedIn(true);
          setStatus("Logged in. Fetching profile…");
          webRef.current?.injectJavaScript(PROFILE_SCRAPE_JS);
        }
      } else if (data.type === "AUTOFILLED") {
        setStatus(data.filled ? "Credentials pre-filled. Solve captcha & tap Login." : "Portal loaded. Enter captcha & login.");
      } else if (data.type === "PROFILE_RESULT") {
        const profile = {
          roll_number: data.roll_number || String(roll || ""),
          name: data.name || "",
          branch: data.branch || "",
          year: data.year || "",
          section: data.section || "",
        };
        storage.setProfile(profile);
        api.saveProfile(profile).catch(() => {});
        setStatus("Profile captured. Opening dashboard…");
        setTimeout(() => router.replace("/(tabs)"), 800);
      } else if (data.type === "ATTENDANCE_RESULT") {
        storage.setAttendance(data);
        api
          .saveAttendance({
            roll_number: String(roll || ""),
            overall_percent: data.overall_percent,
            subjects: data.subjects || [],
          })
          .catch(() => {});
      }
    } catch {}
  }

  return (
    <View style={styles.root} testID="ims-login-root">
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.topIconBtn} testID="ims-back">
          <FeatherIcon name="chevron-left" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>IMS NSUT Login</Text>
          <Text style={styles.topSub} numberOfLines={1}>{status}</Text>
        </View>
        <Pressable
          onPress={() => webRef.current?.reload()}
          style={styles.topIconBtn}
          testID="ims-reload"
        >
          <FeatherIcon name="rotate-cw" size={18} color={colors.onSurface} />
        </Pressable>
      </View>

      {Platform.OS === "web" ? (
        <View style={styles.webFallback}>
          <FeatherIcon name="globe" size={44} color={colors.brandPrimary} />
          <Text style={styles.webTitle}>Open on mobile for IMS login</Text>
          <Text style={styles.webSub}>
            IMS NSUT only loads inside a real mobile WebView. Scan the Expo Go QR to continue.
          </Text>
          <Pressable
            onPress={async () => {
              await storage.setRollAndPassword(String(roll || "guest"), String(pw || ""));
              router.replace("/(tabs)");
            }}
            style={styles.webCta}
          >
            <Text style={styles.webCtaText}>Continue to demo dashboard</Text>
          </Pressable>
        </View>
      ) : (
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
          injectedJavaScript={autofillJS(String(roll || ""), String(pw || "")) + DETECT_LOGIN_JS}
          injectedJavaScriptBeforeContentLoaded={DETECT_LOGIN_JS}
          onNavigationStateChange={(nav) => {
            if (nav.url && nav.url.indexOf("student_login.php") < 0 && nav.url.indexOf("imsnsit.org") >= 0 && !loggedIn) {
              webRef.current?.injectJavaScript(DETECT_LOGIN_JS);
            }
          }}
          style={{ flex: 1, backgroundColor: colors.surface }}
          testID="ims-webview"
        />
      )}

      {loggedIn ? (
        <Pressable
          testID="skip-to-dashboard"
          onPress={() => router.replace("/(tabs)")}
          style={[styles.doneBtn, { bottom: insets.bottom + 16 }]}
        >
          <Text style={styles.doneBtnText}>Continue to Dashboard</Text>
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "500" },
  topSub: { color: colors.muted, fontSize: 11 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, gap: 12 },
  loadingText: { color: colors.muted },
  webFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  webTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "500" },
  webSub: { color: colors.muted, textAlign: "center", maxWidth: 320, lineHeight: 20 },
  webCta: {
    marginTop: spacing.md,
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  webCtaText: { color: colors.onBrandPrimary, fontWeight: "500" },
  doneBtn: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { color: colors.onBrandPrimary, fontWeight: "500", fontSize: 15 },
});
