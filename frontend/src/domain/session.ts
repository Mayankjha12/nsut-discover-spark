// Local access to encrypted cached reports; this does not extend IMS server cookies.
export const SESSION_MS = 90 * 24 * 60 * 60_000;
export type DeviceSession = { roll: string; verifiedAt: number; expiresAt: number };
export function validRoll(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]{4}[A-Z]{2,6}[0-9]{3,6}$/.test(value);
}
export function readSession(raw: unknown, now = Date.now()): DeviceSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as DeviceSession;
  return validRoll(s.roll) && Number.isFinite(s.verifiedAt) && s.verifiedAt <= now && s.expiresAt === s.verifiedAt + SESSION_MS && now < s.expiresAt ? s : null;
}
