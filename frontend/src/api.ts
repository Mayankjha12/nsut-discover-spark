import { Platform } from "react-native";
const origin = (process.env.EXPO_PUBLIC_BACKEND_URL ?? '').replace(/\/+$/, '');
export const backendConfigured = !!origin || Platform.OS === 'web';
export type RoomInfo = { id: string; building: string; room_type: string; status: 'available' | 'occupied' | 'unknown'; reason: string; minutes_until_change: number | null; next_class: { title: string; start: string; end: string } | null };
export type RoomsResponse = { as_of: string; timezone: string; source: string | null; source_url: string | null; observed_at: string | null; stale: boolean; rooms: RoomInfo[]; message: string | null };
export type NoticeItem = { title: string; url: string; source: string };
export type NoticesResponse = { ok: boolean; items: NoticeItem[]; fetched_at?: string | null; stale?: boolean; message?: string };
async function get<T>(path: string): Promise<T> {
  if (!origin && Platform.OS !== 'web') throw new Error('Campus services are not connected in this build. Your saved academic data still works.');
  const control = new AbortController(), timer = setTimeout(() => control.abort(), 12_000);
  try {
    const response = await fetch(`${origin}/api${path}`, { signal: control.signal, credentials: 'omit' });
    if (!response.ok) throw new Error('Campus service is temporarily unavailable. Please try again.');
    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Campus service')) throw error;
    throw new Error('Could not reach campus services. Check your connection or try again later.');
  } finally { clearTimeout(timer); }
}
export const api = { rooms: () => get<RoomsResponse>('/rooms'), notices: () => get<NoticesResponse>('/notices') };
