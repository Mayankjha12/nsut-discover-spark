import { isIMSUrl } from "./domain/portal";
export { isIMSUrl };
/** Read only the page the student explicitly opened. No form submission, hidden requests, or credential access. */
export function capturePage(kind: "attendance" | "timetable", requestId: string) {
  return `(${READ_PAGE_JS})(${JSON.stringify(kind)}, ${JSON.stringify(requestId)}); true;`;
}
const READ_PAGE_JS = String.raw`function readVisiblePage(kind, requestId) {
  const send = (payload) => {
    const bridge = window.ReactNativeWebView;
    bridge && bridge.postMessage(JSON.stringify({ requestId, ...payload }));
  };
  try {
    if (location.protocol !== "https:" || !["www.imsnsit.org", "imsnsit.org"].includes(location.hostname)) return;
    const docs = [document];
    for (const frame of Array.from(document.querySelectorAll("frame,iframe"))) {
      try { const d = frame.contentDocument; if (d && d.location.origin === location.origin) docs.push(d); } catch { /* Cross-origin frames are not read. */ }
    }
    if (!docs.some(d => Array.from(d.querySelectorAll("a")).some(a => /log\s*out|sign\s*out/i.test(a.textContent || "")))) {
      send({ error: "Sign in on the IMS page first. Complete its CAPTCHA and open your report." }); return;
    }
    const clean = (e) => (e.textContent || "").replace(/\s+/g, " ").trim();
    const numeric = (s) => s && /^\d+(\.\d+)?%?$/.test(s.trim()) ? Number(s.trim().replace("%", "")) : null;
    const rolls = new Set();
    for (const d of docs) {
      const content = d.body ? d.body.textContent || "" : "";
      for (const match of content.matchAll(/\broll\s*(?:no\.?|number)\s*:?\s*([0-9]{4}[A-Za-z]{2,6}[0-9]{3,6})\b/gi)) rolls.add(match[1].toUpperCase());
    }
    if (rolls.size > 1) { send({ error: "Conflicting student identifiers. Close this session and retry." }); return; }
    const roll = rolls.size === 1 ? Array.from(rolls)[0] : undefined;
    let found = null;
    // Public IMS app documents a transposed report with these exact summary labels.
    // Require all summary rows and matching widths; never infer counts from blank cells.
    if (kind === "attendance") for (const d of docs) for (const table of Array.from(d.querySelectorAll("#myreport table.plum_fieldbig"))) {
      const headers = Array.from(table.querySelectorAll("tr.plum_head"));
      if (headers.length < 3) continue;
      const codes = Array.from(headers[2].cells).map(clean).slice(1);
      const summary = Array.from(table.rows).map(row => Array.from(row.cells).map(clean));
      const select = (label) => summary.filter(row => row[0] === label);
      const a = select("Overall Present"), t = select("Overall Class"), p = select("Overall (%)");
      if (a.length !== 1 || t.length !== 1 || p.length !== 1 || !codes.length) continue;
      if ([a[0], t[0], p[0]].some(row => row.length !== codes.length + 1)) { send({ error: "Incomplete attendance summary." }); return; }
      if (found) { send({ error: "Multiple reports found." }); return; }
      found = codes.map((code, i) => ({ code, name: code, present: numeric(a[0][i+1]), total: numeric(t[0][i+1]), percent: numeric(p[0][i+1]) }));
    }
    for (const d of docs) for (const table of Array.from(d.querySelectorAll("table"))) {
      const rows = Array.from(table.rows);
      for (let index = 0; index < Math.min(rows.length, 8); index++) {
        const h = Array.from(rows[index].cells).map(e => clean(e).toLowerCase());
        const col = (r) => h.findIndex(v => r.test(v));
        const code = col(/^(subject|course)\s*code$/), name = col(/^(subject|course)(\s*name)?$/);
        const present = col(/^(present|attended|classes attended|total present)$/), total = col(/^(total|classes held|total classes|delivered)$/), percent = col(/^(percentage|percent|attendance\s*%|%)$/);
        const day = col(/^day$/), start = col(/^(start|start time|from)$/), end = col(/^(end|end time|to)$/), room = col(/^(room|classroom|room no\.?)$/), faculty = col(/^(faculty|teacher)$/);
        const match = kind === "attendance" ? code >= 0 && (percent >= 0 || (present >= 0 && total >= 0)) : day >= 0 && name >= 0 && start >= 0 && end >= 0;
        if (!match) continue;
        const parsed = [];
        for (const row of rows.slice(index + 1)) {
          const c = Array.from(row.cells).map(clean);
          if (!c.some(Boolean)) continue;
          if (c.length !== h.length) { send({ error: "Incomplete report row. Previous data was kept." }); return; }
          if (kind === "attendance") {
            if (/^(total|overall)$/i.test(c[code])) continue;
            if (!c[code]) { send({ error: "Missing subject identifier." }); return; }
            parsed.push({ code: c[code], name: name >= 0 ? c[name] : c[code], present: numeric(c[present]), total: numeric(c[total]), percent: numeric(c[percent]) });
          } else {
            const dayIndex = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(c[day].slice(0, 3).toLowerCase());
            parsed.push({ day: dayIndex, start: c[start], end: c[end], subject: c[name], room: c[room] || undefined, faculty: c[faculty] || undefined });
          }
        }
        if (parsed.length) { if (found) { send({ error: "Several matching tables found. Open a single report before syncing." }); return; } found = parsed; }
      }
    }
    if (!found) { send({ error: "This report layout is not supported yet. Previous data was kept. Open the attendance or timetable table in IMS and retry." }); return; }
    send({ kind, rows: found, roll });
  } catch { send({ error: "Could not read this IMS page. Your previously saved data was kept." }); }
}
`;
