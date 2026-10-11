import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { capturePage, isIMSUrl } from "@/src/ims-scraper";
import { IMS_URL, isPortalNavigation, portalProbe } from "@/src/domain/portal";
import { captureBase, normalizeSubjects, normalizeTimetable } from "@/src/domain/academic";
import { storage } from "@/src/storage";
import { Button, Card, Message, Page, ui } from "@/src/components/campus";
import { queryClient } from "@/src/query-client";
export default function LoginScreen() {
  const router = useRouter(), inset = useSafeAreaInsets(), web = useRef<WebView>(null);
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<"loading" | "ready" | "failed">("loading");
  const [failure, setFailure] = useState("");
  const [showReports, setShowReports] = useState(false);
  const probeId = useRef("");
  const emptyPage = useRef(false);
  const probeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearLoading() {
    if (probeTimer.current) clearInterval(probeTimer.current);
    if (loadTimer.current) clearTimeout(loadTimer.current);
  }
  function failLoading(reason: string) { clearLoading(); probeId.current = ""; setFailure(reason); setPhase("failed"); }
  function startLoading() {
    clearLoading(); emptyPage.current = false; setPhase("loading"); setFailure("");
    probeId.current = `${Date.now()}-${Math.random()}`;
    probeTimer.current = setInterval(() => web.current?.injectJavaScript(portalProbe(probeId.current)), 1500);
    loadTimer.current = setTimeout(() => failLoading(emptyPage.current ? "IMS returned an empty page instead of the sign-in form. Please try again later or check the official portal in your browser." : "IMS hasn’t shown its sign-in page. The portal may be unavailable or your connection may be interrupted."), 25_000);
  }
  function retry() { startLoading(); web.current?.reload(); }
  function openBrowser() { Linking.openURL(IMS_URL).catch(() => setMessage("Could not open your browser. Please try again.")); }
  useEffect(() => () => {
    if (probeTimer.current) clearInterval(probeTimer.current);
    if (loadTimer.current) clearTimeout(loadTimer.current);
  }, []);
  const [busy, setBusy] = useState(false);
  const pending = useRef<{ id: string; kind: "attendance" | "timetable" } | null>(null);
  const lastRead = useRef(0), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function capture(kind: "attendance" | "timetable") {
    if (Date.now() - lastRead.current < 30_000) { setMessage("Please wait 30 seconds between reads. The portal is not queried automatically."); return; }
    lastRead.current = Date.now(); const id = `${Date.now()}-${Math.random()}`;
    pending.current = { id, kind }; setBusy(true); setMessage("");
    web.current?.injectJavaScript(capturePage(kind, id));
    timer.current = setTimeout(() => { pending.current = null; setBusy(false); setMessage("IMS did not respond. Reload the portal or sign in again. Your previous data is safe."); }, 15_000);
  }
  async function onMessage(event: WebViewMessageEvent) {
    if (!isIMSUrl(event.nativeEvent.url) || event.nativeEvent.data.length > 200_000) return;
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === "portal-health") {
        if (payload.requestId !== probeId.current || typeof payload.content !== "boolean") return;
        if (payload.content) { clearLoading(); setPhase("ready"); }
        else emptyPage.current = true;
        return;
      }
      if (!pending.current || payload.requestId !== pending.current.id) return;
      const kind = pending.current.kind; pending.current = null;
      if (timer.current) clearTimeout(timer.current); setBusy(false);
      if (payload.error) { setMessage("IMS could not be read. Sign in, solve its CAPTCHA, and open a supported report. Your previous data was kept."); return; }
      if (payload.kind !== kind) throw new Error("Unexpected portal response.");
      const data = captureBase(await storage.read(), payload.roll);
      const capturedAt = new Date().toISOString();
      if (kind === "attendance") data.attendance = { data: normalizeSubjects(payload.rows), capturedAt, source: "ims-page" };
      else data.timetable = { data: normalizeTimetable(payload.rows), capturedAt, source: "ims-page" };
      await storage.save(data); queryClient.clear(); setMessage(`${kind === "attendance" ? "Attendance" : "Timetable"} saved on this device. ${data.profile?.roll ? "Reports are linked by the roll number visible on this page." : "No student identifier was visible, so other saved reports were removed to avoid mixing accounts."}`);
    } catch { if (timer.current) clearTimeout(timer.current); pending.current = null; setBusy(false); setMessage("This report could not be validated or saved. Previous data was kept; try again when IMS is available."); }
  }
  if (Platform.OS === "web") return <Page title="Sign in with IMS" subtitle="Use your IMS account." testID="login-root" action={<Button label="Back" secondary onPress={() => router.replace('/')} />}>
    <Card><Text style={ui.h2}>Continue on the official portal</Text><Text style={ui.text}>Enter your roll number, password and CAPTCHA directly with IMS.</Text><Button label="Open IMS in browser" icon="external-link" onPress={openBrowser}/><Text style={ui.muted}>For saving attendance and timetable into NSUT Hub, use the Android app. A browser sign-in stays in the browser.</Text><Button label="Continue without signing in" secondary onPress={() => router.replace('/(tabs)')}/>{message ? <Message>{message}</Message> : null}</Card>
  </Page>;
  return <View style={[styles.root, { paddingTop: inset.top + 8, paddingBottom: inset.bottom }]} testID="ims-session">
    <View style={styles.header}><Button label="Back" secondary onPress={() => router.replace('/')} /><View style={{ flex: 1 }}><Text style={ui.h3}>Sign in with IMS</Text><Text style={ui.small}>imsnsit.org · Private session</Text></View><Button label="Retry" secondary onPress={retry}/></View>
    <Text style={[ui.small, styles.hint]}>Enter your roll number, password and CAPTCHA below.</Text>
    <View style={styles.portal}>
      <WebView ref={web} source={{ uri: IMS_URL }} incognito sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} saveFormDataDisabled cacheEnabled={false} mixedContentMode="never" allowFileAccess={false} setSupportMultipleWindows={false}
        // Route every navigation through our exact-host check. A narrower originWhitelist
        // makes react-native-webview automatically launch unlisted URLs externally.
        originWhitelist={['*']} onShouldStartLoadWithRequest={request => isPortalNavigation(request.url)}
        onMessage={onMessage} onLoadStart={startLoading} onLoad={() => web.current?.injectJavaScript(portalProbe(probeId.current))}
        onError={event => { event.preventDefault(); failLoading("IMS could not load. Check your internet connection and retry. Your saved data is safe."); }}
        onHttpError={() => failLoading("IMS returned a server error. Please wait a little before retrying.")}
        onLoadSubResourceError={() => failLoading("Part of the IMS page could not load securely. Try again later or open the official portal in your browser.")}
        onRenderProcessGone={() => failLoading("The portal browser stopped. Tap Retry to reopen IMS.")}
        renderError={() => <View/>}
        style={{ flex: 1 }} />
      {phase === 'loading' ? <View pointerEvents="none" style={styles.loading}><ActivityIndicator color="#78DCC8"/><Text style={ui.text}>Opening IMS…</Text><Text style={ui.small}>Waiting for the sign-in page</Text></View> : null}
      {phase === 'failed' ? <ScrollView style={styles.failure} contentContainerStyle={styles.failureContent}><Text style={ui.h2}>IMS isn’t loading right now</Text><Text accessibilityRole="alert" style={ui.text}>{failure}</Text><Button label="Try again" icon="refresh-cw" onPress={retry}/><Button label="Open IMS in browser" secondary icon="external-link" onPress={openBrowser}/><Text style={ui.small}>Browser sign-in stays in your browser. Return here to save reports once IMS is available.</Text><Button label="Use saved data / explore" secondary onPress={() => router.replace('/(tabs)')}/></ScrollView> : null}
    </View>
    <View style={styles.toolbar}><View style={ui.row}><Button label={showReports ? 'Hide report tools' : 'Save a report'} secondary disabled={phase !== 'ready'} onPress={() => setShowReports(!showReports)}/><Button label="Done" secondary onPress={() => router.replace('/(tabs)')}/></View>
      {showReports ? <View style={{ gap: 8 }}><Text style={ui.small}>After signing in, open your attendance or timetable report, then save it here.</Text><View style={ui.row}><Button label="Save attendance" disabled={busy || phase !== 'ready'} onPress={() => capture("attendance")}/><Button label="Save timetable" secondary disabled={busy || phase !== 'ready'} onPress={() => capture("timetable")}/></View></View> : null}
      {message ? <ScrollView style={{ maxHeight: 110 }}><Message>{message}</Message></ScrollView> : null}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' }, header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 }, hint: { paddingHorizontal: 16, paddingVertical: 10 },
  portal: { flex: 1, backgroundColor: '#fff', minHeight: 150 }, loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#0F1115', alignItems: 'center', justifyContent: 'center', gap: 12 },
  failure: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#0F1115' }, failureContent: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 18 }, toolbar: { padding: 12, gap: 10 },
});
