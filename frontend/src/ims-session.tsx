import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { AppState, Platform, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearPortalCookies, flushPortalCookies } from './portal-cookies';
import { automaticPortal } from './ims-auto';
import { IMS_URL, isIMSUrl, isPortalNavigation } from './domain/portal';
import { DeviceSession, SESSION_MS, validRoll } from './domain/session';
import { captureBase, normalizeSubjects, normalizeTimetable } from './domain/academic';
import { storage } from './storage';
import { queryClient } from './query-client';

type State = { ready: boolean; session: DeviceSession | null; phase: 'loading' | 'ready' | 'failed'; message: string; needsLogin: boolean; retry: () => void; logout: () => Promise<void> };
const Context = createContext<State | null>(null);
export const useIMSSession = () => { const value = useContext(Context); if (!value) throw Error('Missing IMS provider'); return value; };
const REFRESH_MS = 15 * 60_000;
export function IMSSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter(), path = usePathname(), inset = useSafeAreaInsets();
  const visible = path === '/login';
  const [ready, setReady] = useState(false), [session, setSession] = useState<DeviceSession | null>(null);
  const [phase, setPhase] = useState<State['phase']>('loading'), [message, setMessage] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false), [epoch, setEpoch] = useState(0);
  const web = useRef<WebView>(null), current = useRef<DeviceSession | null>(null), token = useRef('');
  const attempted = useRef(0), started = useRef(0), finished = useRef(false), received = useRef(false);
  const loaded = useRef(new Set<string>());
  const acceptedRoll = useRef<string | null>(null), queue = useRef(Promise.resolve());
  const mounted = useRef(true), active = useRef(true), pathRef = useRef(path);
  useEffect(() => { pathRef.current = path; }, [path]);
  function begin() {
    token.current = `${Date.now()}-${Math.random()}`; started.current = Date.now(); finished.current = false; received.current = false; acceptedRoll.current = null;
    loaded.current = new Set(); setPhase('loading'); setMessage('');
  }
  function retry() { attempted.current = 0; begin(); web.current?.reload(); }
  async function logout() {
    // Invalidate queued bridge messages before clearing private data or cookies.
    token.current = ''; acceptedRoll.current = null; setReady(false);
    await queue.current;
    try {
      await storage.clear(); queryClient.clear(); current.current = null; setSession(null);
      await clearPortalCookies(); setNeedsLogin(false); attempted.current = 0; begin(); setEpoch(n => n + 1); setReady(true); router.replace('/login');
    } catch { setMessage('Could not clear the IMS session. Please retry signing out.'); throw Error('Sign out failed'); }
  }
  useEffect(() => {
    mounted.current = true;
    storage.session().then(async saved => {
      if (!saved) await clearPortalCookies();
      if (!mounted.current) return;
      current.current = saved; setSession(saved); begin(); setReady(true);
    }).catch(() => { setMessage('Your saved session could not be opened. Restart the app to retry.'); setPhase('failed'); });
    const listener = AppState.addEventListener('change', state => {
      active.current = state === 'active';
      if (active.current && Date.now() - attempted.current >= REFRESH_MS) { begin(); }
    });
    return () => { mounted.current = false; token.current = ''; listener.remove(); };
  }, []);
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    const timer = setInterval(() => {
      if (!active.current) return;
      if (current.current && current.current.expiresAt <= Date.now()) { void logout().catch(() => {}); return; }
      if (!token.current) return;
      if (finished.current) { if (Date.now() - attempted.current >= REFRESH_MS) { begin(); return; } if (pathRef.current === '/login') web.current?.injectJavaScript(automaticPortal(token.current, false)); return; }
      const elapsed = Date.now() - started.current;
      if (elapsed > 65_000 && !received.current) { finished.current = true; setPhase('failed'); setMessage('IMS is taking too long. Check your connection and try again. Saved reports are kept.'); return; }
      if (elapsed > 25_000 && !received.current) { setPhase('failed'); setMessage('IMS returned no usable page. Try again later or check the official portal.'); }
      web.current?.injectJavaScript(automaticPortal(token.current, Date.now() - attempted.current >= REFRESH_MS));
    }, 1500);
    return () => clearInterval(timer);
  // Timer uses refs so report saves do not restart the portal cycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, epoch]);
  useEffect(() => {
    if (visible && needsLogin && finished.current) { attempted.current = 0; begin(); web.current?.reload(); }
  }, [visible, needsLogin]);
  function onMessage(event: WebViewMessageEvent) {
    if (!isIMSUrl(event.nativeEvent.url) || event.nativeEvent.data.length > 200_000) return;
    let p: Record<string, unknown>;
    try { const parsed = JSON.parse(event.nativeEvent.data); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return; p = parsed; } catch { return; }
    const id = token.current;
    if (!id || p.requestId !== id) return;
    if (p.type === 'page-changed' && pathRef.current === '/login') { attempted.current = 0; begin(); return; }
    if (finished.current) return;
    queue.current = queue.current.then(async () => {
      if (!mounted.current || token.current !== id) return;
      if (p.type === 'health') { if (p.content === true) { received.current = true; setPhase('ready'); } return; }
      if (p.type === 'needs-login') { setNeedsLogin(true); setPhase('ready'); if (p.expired === true) { finished.current = true; attempted.current = Date.now(); setMessage('Your IMS session expired. Sign in again to load fresh reports.'); } return; }
      if (p.type === 'authenticated') {
        if (!validRoll(p.roll)) throw Error('Invalid identity');
        const existing = await storage.read();
        if (existing.profile?.roll !== p.roll && (existing.attendance || existing.timetable)) { await storage.clear(); queryClient.clear(); }
        if (token.current !== id) return;
        const next = current.current?.roll === p.roll ? current.current : { roll: p.roll, verifiedAt: Date.now(), expiresAt: Date.now() + SESSION_MS };
        // Use a single timestamp for the fixed 90-day local expiry.
        if (!current.current || current.current.roll !== p.roll) next.expiresAt = next.verifiedAt + SESSION_MS;
        await storage.saveSession(next); await flushPortalCookies(); current.current = next; setSession(next); acceptedRoll.current = p.roll; setNeedsLogin(false); setMessage('Loading your reports…');
        return;
      }
      if (p.kind === 'attendance' || p.kind === 'timetable') {
        if (!acceptedRoll.current || p.roll !== acceptedRoll.current) throw Error('Identity mismatch');
        const data = captureBase(await storage.read(), p.roll), capturedAt = new Date().toISOString();
        if (p.kind === 'attendance') data.attendance = { data: normalizeSubjects(p.rows), capturedAt, source: 'ims-page' };
        else data.timetable = { data: normalizeTimetable(p.rows), capturedAt, source: 'ims-page' };
        await storage.save(data); loaded.current.add(p.kind); await queryClient.invalidateQueries({ queryKey: ['academic'] }); return;
      }
      if (p.error) { setMessage('Some IMS reports could not be read. You can open them on the IMS page; saved records are kept.'); return; }
      if (p.type === 'issue') { attempted.current = Date.now(); finished.current = true; setPhase('failed'); setMessage('IMS could not load your academic data. Open My Profile or your report in IMS, then tap Retry.'); return; }
      if (p.type === 'complete') {
        attempted.current = Date.now(); finished.current = true;
        const data = await storage.read();
        setMessage(loaded.current.size < 2 ? 'IMS did not provide all reports. Check the saved time on each record.' : '');
        if (current.current && pathRef.current === '/login' && (data.attendance || data.timetable)) router.replace('/(tabs)');
        else if (!data.attendance && !data.timetable) setMessage('Choose your current semester and open the attendance report in IMS. It will be read automatically.');
      }
    }).catch(() => { setMessage('An IMS report could not be validated or saved. Your previous valid records are kept.'); setPhase('failed'); });
  }
  function fail() { token.current = ''; setPhase('failed'); setMessage('IMS could not load securely. Check your connection and retry.'); }
  return <Context.Provider value={{ ready, session, phase, message, needsLogin, retry, logout }}>
    <View style={{ flex: 1 }}>{children}
      {ready && Platform.OS !== 'web' ? <View pointerEvents={visible ? 'auto' : 'none'} accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'} style={visible ? { position: 'absolute', top: inset.top + 112, bottom: inset.bottom + 120, left: 12, right: 12, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' } : { position: 'absolute', width: 1, height: 1, opacity: 0, left: -10 }}>
        <WebView key={epoch} ref={web} source={{ uri: IMS_URL }} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} saveFormDataDisabled cacheEnabled mixedContentMode="never" allowFileAccess={false} setSupportMultipleWindows={false}
          originWhitelist={['*']} onShouldStartLoadWithRequest={r => isPortalNavigation(r.url)} onMessage={onMessage}
          onLoadStart={() => { if (visible) { attempted.current = 0; begin(); } }}
          onLoadEnd={() => web.current?.injectJavaScript(automaticPortal(token.current, Date.now() - attempted.current >= REFRESH_MS))}
          onError={fail} onHttpError={e => { if (e.nativeEvent.url === IMS_URL) fail(); }} onRenderProcessGone={fail} renderError={() => <View/>} style={{ flex: 1 }}/>
      </View> : null}
    </View>
  </Context.Provider>;
}
