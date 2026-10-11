export const IMS_URL = "https://www.imsnsit.org/imsnsit/student.htm";
export function isIMSUrl(value: string) {
  try { const u = new URL(value); return u.protocol === "https:" && ["www.imsnsit.org", "imsnsit.org"].includes(u.hostname) && (!u.port || u.port === "443") && !u.username && !u.password; } catch { return false; }
}

// IMS uses empty frames as named navigation targets. They contain no remote content.
export function isPortalNavigation(value: string) {
  return value === "about:blank" || isIMSUrl(value);
}

/** Inspect rendering only; never read field values, cookies, or send requests. */
export function portalProbe(requestId: string) {
  return `(${PROBE_JS})(${JSON.stringify(requestId)}); true;`;
}
const PROBE_JS = String.raw`function probe(requestId) {
  try {
    if (location.protocol !== "https:" || !["www.imsnsit.org", "imsnsit.org"].includes(location.hostname)) return;
    const docs = [document];
    for (const frame of Array.from(document.querySelectorAll("frame,iframe"))) {
      try { const doc = frame.contentDocument; if (doc && doc.location.origin === location.origin) docs.push(doc); } catch {}
    }
    const content = docs.some(doc => {
      if (/\/blank\.htm(?:[?#]|$)/i.test(doc.URL || "")) return false;
      if (doc.querySelector("frameset")) return false;
      return !!doc.querySelector("form") || (doc.body?.innerText || "").trim().length > 30;
    });
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "portal-health", requestId, content }));
  } catch {}
}`;
