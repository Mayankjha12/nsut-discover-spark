import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { AcademicData, EMPTY_DATA, normalizeBackup, overall } from "./domain/academic";
import { DeviceSession, readSession } from "./domain/session";
const SESSION = "nsut_session_v1";
const KEY = "nsut_academic_v2";
const PREF = "nsut_target_v2";
const LEGACY = ["nsut_hub_pw", "nsut_hub_session_cookie", "nsut_hub_roll", "nsut_hub_profile", "nsut_hub_attendance", "nsut_hub_rooms", "nsut_hub_bunk_plan"];
const get = (k: string) => Platform.OS === "web" ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k);
const set = (k: string, v: string) => Platform.OS === "web" ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v);
const del = (k: string) => Platform.OS === "web" ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k);
export const storage = {
  async initialize() {
    // Remove passwords and unvalidated data from older app versions, including web caches.
    const oldRoll = await get("nsut_hub_roll");
    if (oldRoll && /^[A-Za-z0-9_-]{1,80}$/.test(oldRoll)) await del(`nsut_hub_results_${oldRoll}`);
    await Promise.all(LEGACY.map(del));
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter(k => k.startsWith("nsut_hub_")));
  },
  async session() { const raw = await get(SESSION); if (!raw) return null; try { return readSession(JSON.parse(raw)); } catch { return null; } },
  async saveSession(session: DeviceSession) { if (!readSession(session)) throw new Error("Invalid session"); await set(SESSION, JSON.stringify(session)); },
  async clearSession() { await del(SESSION); },
  async read(): Promise<AcademicData> {
    const raw = await get(KEY);
    if (!raw) return { ...EMPTY_DATA, history: [] };
    const parsed = JSON.parse(raw);
    const validated = normalizeBackup(parsed);
    // Sources are retained only for data already stored by this app, never an imported backup.
    if (validated.attendance && parsed.attendance?.source === "ims-page") validated.attendance.source = "ims-page";
    if (validated.timetable && parsed.timetable?.source === "ims-page") validated.timetable.source = "ims-page";
    return validated;
  },
  async save(data: AcademicData) {
    const validated = normalizeBackup(data);
    const pct = validated.attendance ? overall(validated.attendance.data) : null;
    if (pct !== null && validated.attendance && !validated.history.some(h => h.at === validated.attendance!.capturedAt)) validated.history = [...validated.history, { at: validated.attendance.capturedAt, percent: pct }].slice(-30);
    if (validated.attendance) validated.attendance.source = data.attendance?.source === "ims-page" ? "ims-page" : "personal-backup";
    if (validated.timetable) validated.timetable.source = data.timetable?.source === "ims-page" ? "ims-page" : "personal-backup";
    await set(KEY, JSON.stringify(validated));
  },
  async target(): Promise<number> { const n = Number(await get(PREF)); return n >= 1 && n <= 100 ? n : 75; },
  async setTarget(n: number) { if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error("Choose a target from 1 to 100."); await set(PREF, String(n)); },
  async clear() { await Promise.all([del(SESSION), del(KEY), del(PREF), ...LEGACY.map(del)]); await AsyncStorage.multiRemove((await AsyncStorage.getAllKeys()).filter(k => k.startsWith("nsut_hub_"))); },
};
