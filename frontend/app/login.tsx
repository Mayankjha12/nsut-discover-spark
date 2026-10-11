import { useEffect, useRef, useState } from "react";
import { Linking, Platform, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { capturePage, isIMSUrl } from "@/src/ims-scraper";
import { IMS_URL } from "@/src/domain/portal";
import { captureBase, normalizeSubjects, normalizeTimetable } from "@/src/domain/academic";
import { storage } from "@/src/storage";
import { Button, Card, Message, Page, ui } from "@/src/components/campus";
import { queryClient } from "@/src/query-client";
export default function LoginScreen() {
  const router = useRouter(), inset = useSafeAreaInsets(), web = useRef<WebView>(null);
  const [opened, setOpened] = useState(false), [message, setMessage] = useState("");
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
    if (!isIMSUrl(event.nativeEvent.url) || !pending.current || event.nativeEvent.data.length > 200_000) return;
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.requestId !== pending.current.id) return;
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
  if (!opened || Platform.OS === "web") return <Page title="Connect your academic day" subtitle="Your IMS account. Your control." testID="login-root" action={<Button label="Back to Today" secondary onPress={() => router.replace('/(tabs)')}/> }>
    <Card><Text style={ui.h2}>Sign in directly with IMS</Text><Text style={ui.text}>Your roll number, password, and CAPTCHA are entered on the official portal. Discover Spark never reads or saves your password or session cookie.</Text><Text style={ui.muted}>After signing in, open Attendance or your personal timetable, then choose Read page. Only supported table layouts are imported. Failed reads keep the last valid data. Reports are combined only when the same roll number is visible; otherwise a successful read replaces previous academic records.</Text>
      {Platform.OS === "web" ? <><Message>IMS cannot be securely embedded in this web app. Use the Android app for assisted sync, or import your personal Discover Spark backup in More. Opening IMS in another tab does not sign you into this app.</Message><Button label="Open official IMS portal" icon="external-link" onPress={() => { Linking.openURL(IMS_URL).catch(() => setMessage("Could not open the portal. Try again.")); }}/></> : <Button label="Open secure IMS session" icon="lock" onPress={() => setOpened(true)}/>}
      <Text style={ui.small}>No CAPTCHA bypass. No background portal scraping. Sessions exist only inside this temporary browser. Portal downtime, rate limits, and expired sessions must be resolved on the IMS page.</Text>{message ? <Message>{message}</Message> : null}
    </Card>
  </Page>;
  return <View style={[styles.root, { paddingTop: inset.top + 10, paddingBottom: inset.bottom }]} testID="ims-session">
    <View style={{ paddingHorizontal: 14, gap: 10 }}><Text style={ui.h3}>imsnsit.org · private session</Text><Text style={ui.small}>Sign in and solve CAPTCHA on this page. Navigate to your report before reading it.</Text><View style={ui.row}><Button label="Read attendance" disabled={busy} onPress={() => capture("attendance")}/><Button label="Read timetable" secondary disabled={busy} onPress={() => capture("timetable")}/></View>{message ? <Message>{message}</Message> : null}<View style={ui.row}><Button label="Reload IMS" secondary onPress={() => web.current?.reload()}/><Button label="Close session" secondary onPress={() => { setOpened(false); router.replace('/(tabs)'); }}/></View></View>
    <WebView ref={web} source={{ uri: IMS_URL }} incognito sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} saveFormDataDisabled cacheEnabled={false} mixedContentMode="never" allowFileAccess={false} setSupportMultipleWindows={false} originWhitelist={['https://www.imsnsit.org','https://imsnsit.org']} onShouldStartLoadWithRequest={request => isIMSUrl(request.url)} onMessage={onMessage} onError={() => setMessage("IMS could not load. Check your network or try later; saved data is still available.")} onHttpError={() => setMessage("IMS returned an error or rate limit. Please wait before retrying.")} style={{ flex: 1, marginTop: 14 }}/>
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#0F1115' } });
