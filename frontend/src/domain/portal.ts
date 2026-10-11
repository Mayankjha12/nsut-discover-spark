export const IMS_URL = "https://www.imsnsit.org/imsnsit/student.htm";
export function isIMSUrl(value: string) {
  try { const u = new URL(value); return u.protocol === "https:" && ["www.imsnsit.org", "imsnsit.org"].includes(u.hostname) && (!u.port || u.port === "443") && !u.username && !u.password; } catch { return false; }
}
