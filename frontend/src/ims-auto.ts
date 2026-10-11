import { READ_PAGE_JS } from './ims-scraper';
/** Runs inside the official portal. Only follows links discovered in this session.
 * Password/CAPTCHA fields and cookies never cross the WebView bridge.
 */
export function automaticPortal(requestId: string, collect: boolean) {
  return `(${AUTO_JS})(${JSON.stringify(requestId)}, ${collect}, ${READ_PAGE_JS}); true;`;
}
const AUTO_JS = String.raw`async function run(requestId, collect, readReport) {
  const send = data => window.ReactNativeWebView?.postMessage(JSON.stringify({ requestId, ...data }));
  const safe = value => { try { const u = new URL(value, location.href); return u.origin === location.origin && u.protocol === 'https:' && !u.username && !u.password; } catch { return false; } };
  if (!['www.imsnsit.org', 'imsnsit.org'].includes(location.hostname) || location.protocol !== 'https:') return;
  const docs = [document];
  const walk = (doc, depth = 0) => {
    if (depth > 6) return;
    for (const frame of Array.from(doc.querySelectorAll('frame,iframe'))) {
      try { const d = frame.contentDocument; if (d && (d.location.origin === location.origin || ["about:blank", "about:srcdoc"].includes(d.URL)) && !docs.includes(d)) { docs.push(d); walk(d, depth + 1); } } catch {}
    }
  };
  walk(document);
  for (const d of docs) {
    if (!d.querySelector('input[type=password]') || d.getElementById('nsut-login-style')) continue;
    const viewport = d.querySelector('meta[name=viewport]') || d.head.appendChild(d.createElement('meta'));
    viewport.name = 'viewport'; viewport.content = 'width=device-width, initial-scale=1';
    const style = d.createElement('style'); style.id = 'nsut-login-style';
    style.textContent = 'body{font:15px system-ui,sans-serif!important;background:#f6f7fa!important;color:#20232b!important;margin:12px!important}table{max-width:100%!important}input:not([type=hidden]),select{box-sizing:border-box;font:16px system-ui!important;max-width:100%;padding:10px;border:1px solid #aeb4c2;border-radius:8px}input[type=submit],button{background:#20232b!important;color:white!important;min-height:44px;padding:10px 20px!important}a{color:#9c2945!important}';
    d.head.appendChild(style);
  }
  const clean = el => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const links = () => docs.flatMap(d => Array.from(d.querySelectorAll('a')));
  const find = re => links().find(a => re.test(clean(a)) && safe(a.getAttribute('href')));
  const logout = find(/^log\s*out$|^sign\s*out$/i);
  const hasLogin = docs.some(d => d.querySelector('input[type=password]'));
  send({ type: 'health', content: hasLogin || !!logout || docs.some(d => !d.querySelector('frameset') && !/\/blank\.htm/.test(d.URL || '') && (d.body?.innerText || '').trim().length > 30) });
  if (!logout) { if (hasLogin) send({ type: 'needs-login' }); return; }
  // Watch same-origin frame navigation without sending page contents over the bridge.
  const signature = docs.map(d => d.URL + ':' + (d.body?.textContent || '')).join('|');
  if (!collect) {
    if (window.__nsutLastPage !== undefined && window.__nsutLastPage !== signature) send({ type: 'page-changed' });
    window.__nsutLastPage = signature; return;
  }
  window.__nsutLastPage = signature;
  if (window.__nsutCollecting) return;
  window.__nsutCollecting = true;
  const get = async (link, options = {}) => {
    if (!link) return null;
    const url = new URL(link.getAttribute('href'), link.ownerDocument.baseURI).href;
    if (!safe(url)) throw Error('unsafe');
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { credentials: 'same-origin', redirect: 'error', ...options, signal: controller.signal });
      if (!response.ok) throw Error('network');
      const html = await response.text(); if (html.length > 2000000) throw Error('size');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const base = doc.createElement('base'); base.href = url; doc.head.prepend(base);
      if (doc.querySelector('input[type=password]') || /session\s+(?:has\s+)?expired/i.test(doc.body?.textContent || '')) throw Error('expired');
      docs.push(doc); return doc;
    } finally { clearTimeout(timer); }
  };
  try {
    await get(find(/^my\s+profile$/i));
    const rolls = new Set();
    for (const d of docs) {
      const text = ((d.body?.innerText || d.body?.textContent || '') + ' ' + Array.from(d.querySelectorAll('tr')).map(r => Array.from(r.cells).map(clean).join(' ')).join(' ')).replace(/\s+/g, ' ');
      for (const m of text.matchAll(/\broll\s*(?:no\.?|number)\s*:?\s*([0-9]{4}[a-z]{2,6}[0-9]{3,6})\b/gi)) rolls.add(m[1].toUpperCase());
    }
    if (rolls.size !== 1) { send({ type: 'issue', message: 'IMS opened, but your roll number could not be verified. Open My Profile in IMS and try again.' }); return; }
    const roll = Array.from(rolls)[0];
    send({ type: 'authenticated', roll });
    await get(find(/^my\s+activities$/i));
    const courses = await get(find(/^current\s*sem\.?\s*courses\s*registered$/i));
    const semester = courses?.querySelector('#div2.plum_head')?.textContent?.match(/Semester\s+(\d{1,2})\b/i)?.[1];
    const attendance = find(/^my\s+attendance$|^attendance$/i);
    const report = await get(attendance);
    // Use only the selected values from the portal's own attendance report form.
    // Never guess a semester/year, submit a login form or touch CAPTCHA.
    if (report && !report.querySelector('#myreport table.plum_fieldbig')) {
      const form = Array.from(report.forms).find(f => f.querySelector('[name=enc_year]') && f.querySelector('[name=enc_sem]') && f.querySelector('[name=recentitycode]'));
      if (form && !form.querySelector('input[type=password], #captchaimg, [name=cap]')) {
        const fields = Array.from(form.elements);
        const values = new URLSearchParams();
        for (const field of fields) {
          if (!field.name || field.disabled || ['button','reset','file','submit'].includes(field.type) || (['checkbox','radio'].includes(field.type) && !field.checked)) continue;
          values.append(field.name, field.value);
        }
        if (!values.get('sem') && semester) {
          const field = fields.find(f => f.name === 'sem');
          if (field && Array.from(field.options || []).some(o => o.value === semester)) values.set('sem', semester);
        }
        const valid = ['year','sem','enc_year','enc_sem','recentitycode'].every(k => values.get(k)?.trim()) && values.get('recentitycode')?.toUpperCase() === roll;
        const submit = fields.find(f => f.name === 'submit' && /^(submit|go|view|show)$/i.test(f.value));
        const action = new URL(form.getAttribute('action') || attendance.getAttribute('href'), report.baseURI).href;
        const reportURL = new URL(attendance.getAttribute('href'), attendance.ownerDocument.baseURI).href;
        if (valid && submit && action === reportURL && (form.method || '').toLowerCase() === 'post') {
          values.set('submit', submit.value);
          await get(attendance, { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'}, body: values.toString() });
        }
      }
    }
    readReport('attendance', requestId, docs.slice(1));
    const timetable = find(/^my\s+time\s*table$|^student\s+time\s*table$|^time\s*table$/i);
    await get(timetable);
    readReport('timetable', requestId, docs.slice(1));
    send({ type: 'complete' });
  } catch (e) { send({ type: e.message === 'expired' ? 'needs-login' : 'issue', expired: e.message === 'expired', message: 'IMS could not finish loading your reports. Your last saved reports are still available.' }); }
  finally { window.__nsutCollecting = false; }
}`;
