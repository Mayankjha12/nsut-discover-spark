export type Source = "ims-page" | "personal-backup";
export type Subject = { code: string; name: string; present: number | null; total: number | null; percent: number | null };
export type ClassEvent = { id: string; day: number; start: string; end: string; subject: string; room?: string; faculty?: string; cancelled?: boolean };
export type Snapshot<T> = { data: T; capturedAt: string; source: Source };
export type Profile = { name?: string; roll?: string; branch?: string };
export type AcademicData = { version: 1; profile?: Profile; attendance?: Snapshot<Subject[]>; timetable?: Snapshot<ClassEvent[]>; history: { at: string; percent: number }[] };
export const EMPTY_DATA: AcademicData = { version: 1, history: [] };
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MAX_AGE_MS = 24 * 60 * 60_000;
export function validCounts(a: unknown, t: unknown): a is number {
  return typeof a === "number" && typeof t === "number" && Number.isSafeInteger(a) && Number.isSafeInteger(t) && a >= 0 && t >= a;
}
export function percentage(a: number | null, t: number | null) {
  return validCounts(a, t) && t! > 0 ? a! / t! * 100 : null;
}
export function attendancePlan(a: number | null, t: number | null, target: number) {
  if (!validCounts(a, t) || !t || !Number.isFinite(target) || target <= 0 || target > 100) return null;
  const p = target / 100;
  if (a! / t >= p) return { kind: "can-miss" as const, count: Math.max(0, Math.floor(a! / p - t + 1e-9)) };
  if (p === 1) return { kind: "unreachable" as const, count: null };
  return { kind: "attend" as const, count: Math.max(0, Math.ceil((p * t - a!) / (1 - p) - 1e-9)) };
}
export function overall(subjects: Subject[]) {
  // A partial weighted total must not masquerade as overall attendance.
  if (!subjects.length || subjects.some(s => !validCounts(s.present, s.total))) return null;
  return percentage(subjects.reduce((n, s) => n + s.present!, 0), subjects.reduce((n, s) => n + s.total!, 0));
}
export function minutes(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number); return h * 60 + m;
}
export function istTime(now = new Date()) {
  const d = new Date(now.getTime() + 330 * 60_000);
  return { day: (d.getUTCDay() + 6) % 7, minute: d.getUTCHours() * 60 + d.getUTCMinutes(), date: d.toISOString().slice(0, 10) };
}
export function dayClasses(events: ClassEvent[], day: number) { return events.filter(e => e.day === day).sort((a, b) => minutes(a.start)! - minutes(b.start)! || a.id.localeCompare(b.id)); }
export function classStatus(event: ClassEvent, now = new Date()) {
  if (event.cancelled) return "Cancelled";
  const t = istTime(now);
  if (event.day !== t.day) return "Scheduled";
  if (t.minute >= minutes(event.end)!) return "Finished";
  return t.minute >= minutes(event.start)! ? "Scheduled now" : "Upcoming";
}
export function stale(at: string, now = Date.now()) { const age = now - Date.parse(at); return !Number.isFinite(age) || age < -60_000 || age > MAX_AGE_MS; }
export function freshness(at?: string) {
  if (!at) return "Not synced yet";
  return `${stale(at) ? "Outdated cache" : "Last saved"} · ${new Date(at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} IST`;
}
function object(v: unknown): Record<string, unknown> { if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Expected an object."); return v as Record<string, unknown>; }
function text(v: unknown, max = 160): string { if (typeof v !== "string" || !v.trim() || v.length > max) throw new Error("A required text field is missing or too long."); return v.trim(); }
function timestamp(v: unknown) { const value = text(v, 40); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)) || Date.parse(value) > Date.now() + 60_000) throw new Error("Invalid synchronization time."); return new Date(value).toISOString(); }
export function normalizeSubjects(input: unknown): Subject[] {
  if (!Array.isArray(input) || !input.length || input.length > 100) throw new Error("No supported attendance rows found.");
  const seen = new Set<string>();
  return input.map(raw => {
    const s = object(raw), code = text(s.code), name = text(s.name ?? s.code);
    if (seen.has(code)) throw new Error("Duplicate subject codes in attendance."); seen.add(code);
    const a = s.present ?? null, t = s.total ?? null;
    if ((a !== null || t !== null) && !validCounts(a, t)) throw new Error("Attendance counts are inconsistent. Previous data was kept.");
    const calculated = percentage(a as number | null, t as number | null);
    const reported = s.percent ?? null;
    if (reported !== null && (typeof reported !== "number" || !Number.isFinite(reported) || reported < 0 || reported > 100)) throw new Error("Invalid attendance percentage.");
    if (calculated !== null && typeof reported === "number" && Math.abs(calculated - reported) > 1) throw new Error("Counts and percentage disagree. Previous data was kept.");
    return { code, name, present: a as number | null, total: t as number | null, percent: t === 0 ? null : calculated ?? reported as number | null };
  });
}
export function normalizeTimetable(input: unknown): ClassEvent[] {
  if (!Array.isArray(input) || input.length > 200) throw new Error("Unsupported timetable data.");
  const seen = new Set<string>();
  return input.map(raw => {
    const e = object(raw), day = e.day;
    if (!Number.isInteger(day) || (day as number) < 0 || (day as number) > 6) throw new Error("Invalid timetable day.");
    const start = text(e.start, 5), end = text(e.end, 5);
    if (minutes(start) === null || minutes(end) === null || minutes(end)! <= minutes(start)!) throw new Error("Invalid class time. Use 24-hour HH:MM; split overnight classes.");
    const subject = text(e.subject), id = `${day}:${start}:${end}:${subject}`;
    if (seen.has(id)) throw new Error("Duplicate timetable event."); seen.add(id);
    if (e.cancelled !== undefined && typeof e.cancelled !== "boolean") throw new Error("Invalid cancellation status.");
    return { id, day: day as number, start, end, subject, room: e.room ? text(e.room, 80) : undefined, faculty: e.faculty ? text(e.faculty) : undefined, cancelled: e.cancelled === true };
  });
}
export function normalizeBackup(value: unknown, source: Source = "personal-backup"): AcademicData {
  const data = object(value);
  if (data.version !== 1) throw new Error("Unsupported backup version.");
  const result: AcademicData = { version: 1, history: [] };
  if (data.profile) { const p = object(data.profile); result.profile = { name: p.name ? text(p.name) : undefined, roll: p.roll ? text(p.roll, 40) : undefined, branch: p.branch ? text(p.branch) : undefined }; }
  if (data.attendance) { const a = object(data.attendance); result.attendance = { data: normalizeSubjects(a.data), capturedAt: timestamp(a.capturedAt), source }; }
  if (data.timetable) { const t = object(data.timetable); result.timetable = { data: normalizeTimetable(t.data), capturedAt: timestamp(t.capturedAt), source }; }
  if (!result.attendance && !result.timetable) throw new Error("Backup contains no attendance or timetable.");
  if (Array.isArray(data.history)) result.history = data.history.slice(-30).map(raw => { const h = object(raw); if (typeof h.percent !== "number" || !Number.isFinite(h.percent) || h.percent < 0 || h.percent > 100) throw new Error("Invalid attendance history."); return { at: timestamp(h.at), percent: h.percent }; });
  return result;
}

/** Merge only when both reports carry the same portal-visible student identifier. */
export function captureBase(existing: AcademicData, roll: unknown): AcademicData {
  const identity = typeof roll === "string" && /^[0-9]{4}[A-Z]{2,6}[0-9]{3,6}$/.test(roll) ? roll : undefined;
  return identity && existing.profile?.roll === identity
    ? existing
    : { version: 1, history: [], profile: identity ? { roll: identity } : undefined };
}
