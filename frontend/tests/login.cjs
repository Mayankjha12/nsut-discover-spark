// Native session state machine + actual injected scripts against synthetic DOM fixtures.
// This is not a real IMS/device integration test.
process.chdir(require('node:path').resolve(__dirname, '..'));
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
function load(file, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: key => imports[key], URL, Date, Set });
  return exports;
}
const session = load('src/domain/session.ts');
const academic = load('src/domain/academic.ts');
const portal = load('src/domain/portal.ts');
const scraper = load('src/ims-scraper.ts', { './domain/portal': portal });
const auto = load('src/ims-auto.ts', { './ims-scraper': scraper });
const origin = 'https://www.imsnsit.org';
const roll = '2023UCS1234';
const report = `<div id="myreport"><table class="plum_fieldbig"><tr class="plum_head"><td>Heading</td></tr><tr class="plum_head"><td>Courses</td></tr><tr class="plum_head"><td>Date</td><td>CS101</td></tr><tr><td>Overall Class</td><td>4</td></tr><tr><td>Overall Present</td><td>3</td></tr><tr><td>Overall (%)</td><td>75%</td></tr></table></div>`;
const schedule = '<table><tr><td>Day</td><td>Subject</td><td>Start</td><td>End</td><td>Room</td></tr><tr><td>Monday</td><td>CS101</td><td>09:00</td><td>10:00</td><td>APJ-01</td></tr></table>';
const home = '<a href="logout.php">Logout</a><a href="profile.php">My Profile</a><a href="activities.php">My Activities</a>';
const activities = '<a href="attendance.php">My Attendance</a><a href="timetable.php">My Timetable</a>';
const fields = { year: '2026-27', sem: '3', enc_year: 'synthetic-year', enc_sem: 'synthetic-sem', recentitycode: roll };
const form = overrides => `<form method="post">${Object.entries({...fields,...overrides}).map(([name,value])=>`<input name="${name}" value="${value}">`).join('')}<input type="submit" name="submit" value="Submit"></form>`;
async function run({ html = home, routes = {}, collect = true, nested = false } = {}) {
  const dom = new JSDOM(html, { url: `${origin}/imsnsit/student.htm`, runScripts: 'outside-only' });
  const w = dom.window, messages = [], requests = [];
  if (nested) {
    w.document.body.innerHTML = '<iframe></iframe>';
    const frame = w.document.querySelector('iframe').contentDocument;
    frame.body.innerHTML = '<iframe></iframe>';
    frame.querySelector('iframe').contentDocument.body.innerHTML = home;
  }
  w.ReactNativeWebView = {postMessage: m => messages.push(JSON.parse(m))};
  w.fetch = async (url, options) => {
    requests.push({url,options});
    const key = `${options.method || 'GET'} ${new URL(url).pathname.split('/').pop()}`;
    const body = routes[key];
    return {ok:body !== undefined,text:async()=>body};
  };
  // Return the injected async function's promise rather than its trailing WebView sentinel.
  await w.eval(auto.automaticPortal('nonce', collect).replace(/; true;$/, ''));
  w.close();
  return {messages,requests};
}
(async () => {
  const now = Date.now(), value = {roll,verifiedAt:now,expiresAt:now+session.SESSION_MS};
  assert(session.readSession(value,now)); assert(session.readSession(value,now+session.SESSION_MS-1));
  assert.equal(session.readSession(value,now+session.SESSION_MS),null);
  assert.equal(session.readSession({...value,expiresAt:value.expiresAt+1},now),null);
  assert.equal(session.readSession({...value,verifiedAt:now+1},now),null);
  assert.equal(session.readSession({...value,roll:'bad'},now),null);
  console.log('PASS fixed 90-day session boundary, invalid identity, future timestamp, tampered expiry');
  const routes = {'GET profile.php':`<table><tr><td>Roll Number:</td><td>${roll}</td></tr></table>`,'GET activities.php':activities,'GET attendance.php':report,'GET timetable.php':schedule};
  let result = await run({routes});
  assert(result.messages.some(m=>m.type==='authenticated' && m.roll===roll));
  const attendance = result.messages.find(m=>m.kind==='attendance');
  assert(attendance); assert.equal(academic.normalizeSubjects(attendance.rows)[0].percent,75);
  assert.equal(academic.normalizeTimetable(result.messages.find(m=>m.kind==='timetable').rows)[0].room,'APJ-01');
  assert.equal(result.messages.at(-1).type,'complete'); assert.equal(result.requests.length,4);
  assert(result.requests.every(r=>r.options.credentials==='same-origin' && r.options.redirect==='error' && r.options.cache==='no-store'));
  console.log('PASS discovered report links, profile identity, automatic attendance/timetable parsing');
  result = await run({routes,nested:true});
  assert(result.messages.some(m=>m.type==='authenticated'));
  console.log('PASS nested same-origin frames');
  result = await run({html:'<form><input type="password" value="do-not-read"><input name="cap" value="captcha"><img id="captchaimg"></form>'});
  assert.equal(result.requests.length,0); assert(result.messages.some(m=>m.type==='needs-login'));
  assert(!JSON.stringify(result.messages).includes('do-not-read')); assert(!result.messages.some(m=>m.type==='authenticated'));
  result = await run({html:home+'<form><input type="password"></form>',routes});
  assert.equal(result.requests.length,0); assert(!result.messages.some(m=>m.type==='authenticated'));
  result = await run({html:'<p>IMS banner text with no usable student sign in form</p>'});
  assert.equal(result.messages.find(m=>m.type==='health').content,false);
  assert.equal(result.requests.length,0);
  console.log('PASS login/CAPTCHA stay in IMS and no credentials cross bridge');
  result = await run({routes,collect:false}); assert.equal(result.requests.length,0);
  result = await run({html:home.replace('profile.php','https://attacker.test/profile'), routes});
  assert(!result.messages.some(m=>m.type==='authenticated')); assert.equal(result.requests.length,0);
  result = await run({routes:{...routes,'GET profile.php':'Session expired'}});
  assert(result.messages.some(m=>m.type==='needs-login')); assert(!result.messages.some(m=>m.type==='authenticated'));
  result = await run({routes:{...routes,'GET profile.php':`Roll Number: ${roll} Roll Number: 2024UCS4567`}});
  assert(!result.messages.some(m=>m.type==='authenticated'));
  console.log('PASS cache-only probe, external links rejected, expired/conflicting identities rejected');
  result = await run({routes:{...routes,'GET attendance.php':form({}),'POST attendance.php':report}});
  assert.equal(result.requests.filter(r=>r.options.method==='POST').length,1);
  assert.equal(new URLSearchParams(result.requests.find(r=>r.options.method==='POST').options.body).get('sem'),'3');
  assert(result.messages.some(m=>m.kind==='attendance'));
  for (const html of [form({sem:''}),form({recentitycode:'2024UCS4567'}),form({}).replace('<form','<form action="/other"'),form({}).replace('</form>','<input name="cap"></form>')]) {
    result=await run({routes:{...routes,'GET attendance.php':html}});
    assert(!result.requests.some(r=>r.options.method==='POST'));
  }
  console.log('PASS report form uses current portal values; incomplete, account mismatch, different action and CAPTCHA forms never submitted');
  console.log('6 automatic-login fixture groups passed (no live IMS claim)');
})().catch(e=>{console.error(e);process.exitCode=1;});
