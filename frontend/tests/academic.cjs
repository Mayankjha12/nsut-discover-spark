process.chdir(require("node:path").resolve(__dirname, ".."));
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => imports[name], Date, Set, URL, console });
  return exports;
}
const d = load('src/domain/academic.ts');
const portal = load('src/domain/portal.ts');
const { capturePage } = load('src/ims-scraper.ts', { './domain/portal': portal });
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS', name); }
test('weighted totals, missing values, zero denominator and real zero', () => {
  assert.equal(d.percentage(0, 0), null); assert.equal(d.percentage(0, 10), 0);
  assert.equal(d.percentage(11, 10), null); assert.equal(d.percentage(1.5, 10), null);
  assert(Math.abs(d.overall([{ present: 1, total: 2 }, { present: 9, total: 10 }]) - 1000/12) < 1e-9);
  assert.equal(d.overall([{ present: 1, total: null }]), null);
});
test('attendance recovery, miss allowance, exact threshold and 100 percent', () => {
  assert.equal(d.attendancePlan(6, 10, 75).count, 6);
  assert.equal(d.attendancePlan(9, 10, 75).count, 2);
  assert.equal(d.attendancePlan(3, 4, 75).count, 0);
  assert.equal(d.attendancePlan(3, 4, 100).kind, 'unreachable');
  assert.equal(d.attendancePlan(4, 4, 100).count, 0);
  for (const target of [0, -1, 101, NaN]) assert.equal(d.attendancePlan(3, 4, target), null);
});
test('normalization rejects inconsistent counts, duplicates and false percentages', () => {
  assert.throws(() => d.normalizeSubjects([{ code:'A',present:9,total:8 }]));
  assert.throws(() => d.normalizeSubjects([{ code:'A',present:3,total:4,percent:20 }]));
  assert.throws(() => d.normalizeSubjects([{ code:'A' }, { code:'A' }]));
  assert.equal(d.normalizeSubjects([{ code:'A' }])[0].percent, null);
});
test('IST midnight, day ordering and exact class boundaries', () => {
  assert.equal(d.istTime(new Date('2026-10-11T18:30:00Z')).day, 0);
  assert.equal(d.istTime(new Date('2026-10-11T18:29:00Z')).day, 6);
  const rows = d.normalizeTimetable([{ day:0,start:'10:00',end:'11:00',subject:'B' }, { day:0,start:'09:00',end:'10:00',subject:'A' }]);
  assert.equal(d.dayClasses(rows,0)[0].subject,'A');
  assert.equal(d.classStatus(rows[1],new Date('2026-10-12T03:30:00Z')),'Scheduled now');
  assert.equal(d.classStatus(rows[1],new Date('2026-10-12T04:30:00Z')),'Finished');
  assert.equal(d.classStatus({...rows[1],cancelled:true}),'Cancelled');
  assert.throws(() => d.normalizeTimetable([{ day:0,start:'23:00',end:'01:00',subject:'A' }]));
});
test('backup validation, provenance and account isolation', () => {
  const backup = {version:1, profile:{roll:'2023UCS1234'},attendance:{data:[{code:'A',present:3,total:4}],capturedAt:new Date().toISOString(),source:'ims-page'}};
  const parsed = d.normalizeBackup(backup);
  assert.equal(parsed.attendance.source,'personal-backup');
  assert.equal(d.captureBase(parsed,'2023UCS1234'),parsed);
  assert.equal(d.captureBase(parsed,'2023UCS9999').attendance,undefined);
  assert.equal(d.captureBase(parsed,undefined).attendance,undefined);
  assert.throws(() => d.normalizeBackup({...backup,attendance:{...backup.attendance,capturedAt:'2999-01-01'}}));
});
test('portal allowlist rejects credentials, HTTP and deceptive hosts', () => {
  assert(portal.isIMSUrl('https://www.imsnsit.org/imsnsit/student.htm'));
  for (const url of ['http://imsnsit.org','https://imsnsit.org.evil.test','https://evil.test/imsnsit.org','https://user:pass@imsnsit.org']) assert(!portal.isIMSUrl(url));
});
test('IMS empty frame navigation is allowed without accepting other origins', () => {
  assert(portal.isPortalNavigation('about:blank'));
  assert(portal.isPortalNavigation('https://www.imsnsit.org/imsnsit/student_login.php'));
  for (const url of ['about:blank#evil', 'javascript:alert(1)', 'file:///etc/passwd', 'intent://imsnsit.org', 'https://imsnsit.org:444', 'http://imsnsit.org']) assert(!portal.isPortalNavigation(url));
});
test('portal rendering probe distinguishes empty IMS frames from a real form', () => {
  const origin = 'https://www.imsnsit.org';
  function doc(url, text = '', form = false, frameset = false) {
    return {URL:url, location:{origin}, body:{innerText:text}, querySelector(s) { return s === 'form' ? form : s === 'frameset' ? frameset : null; },querySelectorAll(){return [];}};
  }
  function probe(children, host = 'www.imsnsit.org') {
    let result;
    const root = doc(origin+'/imsnsit/student.htm', '', false, true);
    root.querySelectorAll = () => children.map(d => ({contentDocument:d}));
    vm.runInNewContext(portal.portalProbe('health-nonce'), {location:{protocol:'https:',hostname:host,origin},document:root,window:{ReactNativeWebView:{postMessage(value){result=JSON.parse(value);}}}});
    return result;
  }
  const blank = doc(origin+'/imsnsit/blank.htm', 'PLUM ERP decorative content that must not count as a login');
  assert.equal(probe([blank, doc(origin+'/imsnsit/student_login.php')]).content,false);
  const form = doc(origin+'/imsnsit/student_login.php', '', true);
  // Any attempt to read credential values fails the fixture.
  Object.defineProperty(form, 'forms', {get(){throw Error('Credential access forbidden');}});
  assert.equal(probe([blank,form]).content,true);
  assert.equal(probe([doc(origin+'/report', 'Your academic report is available on this page')]).content,true);
  const foreign = doc('https://elsewhere.test'); foreign.location.origin='https://elsewhere.test'; foreign.querySelector=()=>{throw Error('Cross origin read');};
  assert.equal(probe([foreign]).content,false);
  assert.equal(probe([form], 'evil.test'),undefined);
  assert.equal(probe([form]).requestId,'health-nonce');
});
const cell = text => ({ textContent: text });
const row = values => ({cells:values.map(cell)});
function extract(kind, tables, matrix = [], loggedIn = true) {
  let output;
  const document = {body:{textContent:'Roll Number: 2023UCS1234'},querySelectorAll(selector) {
    if (selector === 'a') return loggedIn ? [cell('Logout')] : [];
    if (selector === 'table') return tables;
    if (selector === '#myreport table.plum_fieldbig') return matrix;
    return [];
  }};
  vm.runInNewContext(capturePage(kind,'fixture-nonce'), { location:{protocol:'https:',hostname:'www.imsnsit.org',origin:'https://www.imsnsit.org'},document,window:{ReactNativeWebView:{postMessage(value){output=JSON.parse(value);}}} });
  return output;
}
test('injected script executes independently and captures row report', () => {
  const table = { rows: [row(['Subject Code','Present','Total','Percentage']),row(['A','3','4','75%'])] };
  const result = extract('attendance',[table]);
  assert.equal(result.requestId,'fixture-nonce'); assert.equal(result.roll,'2023UCS1234');
  assert.equal(d.normalizeSubjects(result.rows)[0].percent,75);
  assert(extract('attendance',[table],[],false).error);
  assert(extract('attendance',[table,table]).error);
  assert(extract('attendance',[{rows:[...table.rows,row(['partial'])]}]).error);
});
test('documented transposed summary is supported without guessing absent counts', () => {
  const headers = [row(['heading']),row(['subheading']),row(['Date','A','B'])];
  const table = {rows:[...headers,row(['Overall Class','4','10']),row(['Overall  Present','3','8']),row(['Overall (%)','75%','80%'])],querySelectorAll(){return headers;}};
  const result=extract('attendance',[],[table]);
  assert.equal(d.normalizeSubjects(result.rows)[1].present,8);
});
test('timetable parser and unsupported report fail safely', () => {
  const table = {rows:[row(['Day','Subject','Start','End','Room']),row(['Monday','A','09:00','10:00','APJ-101'])]};
  assert.equal(d.normalizeTimetable(extract('timetable',[table]).rows)[0].day,0);
  assert(extract('attendance',[]).error);
});
(async () => {
  const values = new Map([['nsut_hub_pw','synthetic-legacy-secret'],['nsut_hub_roll','2023UCS1234'],['nsut_hub_results_2023UCS1234','legacy']]);
  const mock = { getItem: async k => values.get(k) ?? null, setItem: async (k,v) => { values.set(k,v); }, removeItem: async k => { values.delete(k); }, getAllKeys: async () => [...values.keys()], multiRemove: async keys => keys.forEach(k => values.delete(k)) };
  const { storage } = load('src/storage.ts', { 'expo-secure-store': {}, '@react-native-async-storage/async-storage': mock, 'react-native': { Platform: { OS: 'web' } }, './domain/academic': d });
  await storage.initialize(); assert.equal(values.size,0);
  assert.equal((await storage.read()).attendance,undefined);
  const data=d.normalizeBackup({version:1,attendance:{data:[{code:'A',present:3,total:4}],capturedAt:new Date().toISOString(),source:'ims-page'}});
  await storage.save(data);
  const saved=await storage.read(); assert.equal(saved.attendance.source,'personal-backup'); assert.equal(saved.history[0].percent,75);
  const previous=values.get('nsut_academic_v2');
  await assert.rejects(storage.save({...data,attendance:{...data.attendance,data:[{code:'A',present:10,total:4}]}}));
  assert.equal(values.get('nsut_academic_v2'),previous);
  await storage.setTarget(80); assert.equal(await storage.target(),80);
  await assert.rejects(storage.setTarget(101));
  await storage.clear(); assert.equal(values.size,0); assert.equal(await storage.target(),75);
  checks++; console.log('PASS storage migration, provenance, failed-save preservation and clearing');
  console.log(`${checks} domain, portal and storage fixture groups passed`);
})().catch(error => { console.error(error); process.exitCode=1; });
