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
  news: () => j("/news"),
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
  cgpa?: number | null;
  semester_sgpas?: number[];
  raw_preview?: string;
  error?: string;
};
