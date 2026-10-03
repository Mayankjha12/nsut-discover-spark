import Constants from "expo-constants";

const API_BASE =
  (process.env.EXPO_PUBLIC_BACKEND_URL as string | undefined) ||
  (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_BACKEND_URL ||
  "";

async function j<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  base: API_BASE,
  health: () => j("/health"),
  vacantRooms: (slot?: number) =>
    j<VacantRoomsResponse>(`/vacant-rooms${slot != null ? `?slot=${slot}` : ""}`),
  saveProfile: (p: any) =>
    j("/profile", { method: "POST", body: JSON.stringify(p) }),
  getProfile: (roll: string) => j(`/profile/${roll}`),
  saveAttendance: (p: any) =>
    j("/attendance", { method: "POST", body: JSON.stringify(p) }),
  getAttendance: (roll: string) => j(`/attendance/${roll}`),
  results: (roll: string) => j<ResultsResponse>(`/results/${roll}`),
  notices: () => j<NoticesResponse>("/notices"),
  saveRoomTimetable: (p: any) => j("/room-timetable", { method: "POST", body: JSON.stringify(p) }),
  news: () => j("/news"),
};

export type NoticeItem = { title: string; url: string; is_new: boolean; source: string };
export type NoticesResponse = { ok: boolean; items: NoticeItem[]; cached?: boolean; stale?: boolean; error?: string };

export type ResultSubject = { subject_code: string; grade: string; credits: number | null };
export type ResultSemester = {
  semester: string;
  sgpa: number | null;
  credits_registered: string;
  credits_secured: string;
  subjects: ResultSubject[];
};

export type VacantRoomsResponse = {
  weekday: number;
  weekday_name: string;
  current_slot: number | null;
  chosen_slot: number | null;
  ist_time: string;
  slots: {
    index: number;
    start: string;
    end: string;
    vacant_count: number;
    total: number;
    rooms: string[];
    is_current: boolean;
  }[];
};

export type ResultsResponse = {
  ok: boolean;
  roll_number?: string;
  url?: string;
  name?: string | null;
  branch_code?: string | null;
  year_of_study?: string | null;
  cgpa?: number | null;
  rank?: number | null;
  branch_rank?: number | null;
  percentile?: number | null;
  credits_completed?: number | null;
  semester_sgpas?: number[];
  semesters?: ResultSemester[];
  grade_distribution?: Record<string, number>;
  total_subjects?: number | null;
  cached?: boolean;
  stale?: boolean;
  fetched_at?: string;
  error?: string;
};
